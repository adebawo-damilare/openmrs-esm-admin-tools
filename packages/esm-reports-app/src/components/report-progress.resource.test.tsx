import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { openmrsFetch, useConfig } from '@openmrs/esm-framework';
import { useReportProgress } from './report-progress.resource';
import { cancelActiveReportRequest } from './reports.resource';

const fetchMock = jest.mocked(openmrsFetch);
const configMock = jest.mocked(useConfig);
const endpoint = '/ws/rest/v1/nmrsreports/requests';
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
);
beforeEach(() => {
  jest.useFakeTimers();
  fetchMock.mockReset();
  configMock.mockReturnValue({ reportRequestStatusEndpoint: endpoint });
});
afterEach(() => {
  jest.useRealTimers();
});

it('batches only active visible requests and records receipt time', async () => {
  fetchMock.mockResolvedValue({
    data: { results: [{ uuid: 'b', status: 'PROCESSING', stage: 'WRITING_OUTPUT', serverTime: 2000 }] },
  } as never);
  const { result } = renderHook(
    () =>
      useReportProgress([
        { id: 'b', status: 'PROCESSING' },
        { id: 'a', status: 'REQUESTED' },
        { id: 'c', status: 'COMPLETED' },
      ]),
    { wrapper },
  );
  await act(() => jest.advanceTimersByTimeAsync(0));
  expect(fetchMock).toHaveBeenCalledWith(`${endpoint}?uuids=a%2Cb`);
  expect(result.current.b.stage).toBe('WRITING_OUTPUT');
  expect(result.current.b.receivedAt).toEqual(expect.any(Number));
});

it('does not request optional metadata when disabled or idle', async () => {
  configMock.mockReturnValue({ reportRequestStatusEndpoint: '' });
  renderHook(() => useReportProgress([{ id: 'a', status: 'PROCESSING' }]), { wrapper });
  await act(() => jest.advanceTimersByTimeAsync(10000));
  expect(fetchMock).not.toHaveBeenCalled();
});

it('falls back to the standard timestamps when optional metadata is unavailable', async () => {
  fetchMock.mockRejectedValue({ status: 404 });
  const { result } = renderHook(() => useReportProgress([{ id: 'a', status: 'PROCESSING' }]), { wrapper });
  await act(() => jest.advanceTimersByTimeAsync(0));
  expect(result.current).toEqual({});
});

it('uses guarded NMRS cancellation without a generic DELETE', async () => {
  fetchMock.mockResolvedValue({} as never);
  await cancelActiveReportRequest('a', endpoint);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(`${endpoint}/a/cancel`, { method: 'POST' });
});

it.each([403, 409, 500])('never bypasses an NMRS %s error with DELETE', async (status) => {
  fetchMock.mockRejectedValue({ response: { status } });
  await expect(cancelActiveReportRequest('a', endpoint)).rejects.toBeDefined();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('can cancel on an older server where the optional endpoint is absent', async () => {
  fetchMock
    .mockRejectedValueOnce({ response: { status: 404 } })
    .mockResolvedValueOnce({ data: { status: 'PROCESSING' } } as never)
    .mockResolvedValueOnce({} as never);
  await cancelActiveReportRequest('a', endpoint);
  expect(fetchMock).toHaveBeenLastCalledWith('/ws/rest/v1/reportingrest/reportRequest/a', { method: 'DELETE' });
});
