import React from 'react';
import { SWRConfig } from 'swr';
import { act, renderHook } from '@testing-library/react';
import { openmrsFetch } from '@openmrs/esm-framework';
import { useReports } from './reports.resource';

const fetchMock = jest.mocked(openmrsFetch);
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
);
function response(status: string) {
  return {
    data: {
      results: [
        {
          uuid: 'request-1',
          status,
          parameterizable: { name: 'Test report', parameters: [] },
          requestedBy: { uuid: 'owner', person: { display: 'User' } },
          requestDate: '2026-10-14T12:00:00Z',
          renderingMode: { label: 'CSV' },
          parameterMappings: {},
        },
      ],
      totalCount: 1,
    },
  };
}
beforeEach(() => {
  jest.useFakeTimers();
  fetchMock.mockReset();
});
afterEach(() => {
  jest.useRealTimers();
});

it('polls active reports every five seconds and stops when finished', async () => {
  fetchMock
    .mockResolvedValueOnce(response('REQUESTED') as never)
    .mockResolvedValueOnce(response('PROCESSING') as never)
    .mockResolvedValue(response('COMPLETED') as never);
  const { result } = renderHook(() => useReports('REQUESTED,PROCESSING,COMPLETED', 0, 10), { wrapper });
  await act(() => jest.advanceTimersByTimeAsync(0));
  expect(result.current.reports[0].status).toBe('REQUESTED');
  await act(() => jest.advanceTimersByTimeAsync(5000));
  expect(result.current.reports[0].status).toBe('PROCESSING');
  await act(() => jest.advanceTimersByTimeAsync(5000));
  expect(result.current.reports[0].status).toBe('COMPLETED');
  await act(() => jest.advanceTimersByTimeAsync(20000));
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it('does not poll an idle page', async () => {
  fetchMock.mockResolvedValue(response('COMPLETED') as never);
  renderHook(() => useReports('COMPLETED', 0, 10), { wrapper });
  await act(() => jest.advanceTimersByTimeAsync(0));
  await act(() => jest.advanceTimersByTimeAsync(20000));
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('does not postpone polling when an elapsed clock causes repeated renders', async () => {
  fetchMock.mockResolvedValue(response('PROCESSING') as never);
  const { rerender } = renderHook(() => useReports('PROCESSING', 0, 10), { wrapper });
  await act(() => jest.advanceTimersByTimeAsync(0));
  for (let i = 0; i < 5; i++) {
    rerender();
    await act(() => jest.advanceTimersByTimeAsync(1000));
  }
  expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
});
