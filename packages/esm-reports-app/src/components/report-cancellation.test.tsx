import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { openmrsFetch, showSnackbar } from '@openmrs/esm-framework';
import { cancelActiveReportRequest } from './reports.resource';
import CancelReportModal from './run-report/cancel-report-modal.component';

const fetchMock = jest.mocked(openmrsFetch);
const snackbarMock = jest.mocked(showSnackbar);

beforeEach(() => {
  jest.clearAllMocks();
});

it.each(['REQUESTED', 'PROCESSING'])('cancels %s requests through the standard Reporting REST API', async (status) => {
  fetchMock.mockResolvedValueOnce({ data: { status } } as never).mockResolvedValueOnce({} as never);
  await cancelActiveReportRequest('request-1');
  expect(fetchMock).toHaveBeenNthCalledWith(2, '/ws/rest/v1/reportingrest/reportRequest/request-1', {
    method: 'DELETE',
  });
});

it.each(['COMPLETED', 'SAVED', 'FAILED'])(
  'does not delete a %s report through a stale cancel action',
  async (status) => {
    fetchMock.mockResolvedValueOnce({ data: { status } } as never);
    await expect(cancelActiveReportRequest('request-1')).rejects.toThrow('no longer queued or running');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  },
);

it('keeps the modal open after cancellation fails', async () => {
  fetchMock.mockRejectedValueOnce(new Error('Forbidden'));
  const closeModal = jest.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <CancelReportModal closeModal={closeModal} reportRequestUuid="request-1" modalType="cancel" />
    </SWRConfig>,
  );
  fireEvent.click(screen.getByRole('button', { name: /Yes/ }));
  await waitFor(() => expect(snackbarMock).toHaveBeenCalledWith(expect.objectContaining({ kind: 'error' })));
  expect(closeModal).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /Yes/ })).toBeEnabled();
});
