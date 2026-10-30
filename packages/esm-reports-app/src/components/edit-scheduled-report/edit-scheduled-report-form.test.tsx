import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { of } from 'rxjs';
import { runReportObservable } from '../reports.resource';
import EditScheduledReportForm from './edit-scheduled-report-form.component';

jest.mock('@openmrs/esm-framework', () => ({
  getCoreTranslation: (key: string) => key,
  showSnackbar: jest.fn(),
  useLayoutType: () => 'desktop',
}));
jest.mock('../reports.resource', () => ({
  runReportObservable: jest.fn(),
  useReportDefinition: () => ({ name: 'ART Linelist', parameters: [] }),
  useReportDesigns: () => ({
    reportDesigns: [
      { uuid: 'excel', name: 'Excel' },
      { uuid: 'csv', name: 'CSV' },
    ],
  }),
  useReportRequest: () => ({
    reportRequest: mockReportRequest,
  }),
}));
jest.mock('../simple-cron-editor/simple-cron-editor.component', () => ({
  __esModule: true,
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange('0 0 1 * * ?', true)}>
      Set schedule
    </button>
  ),
}));
const mockReportRequest = {
  renderingMode: { argument: 'historical-web' },
  schedule: '0 0 1 * * ?',
  parameterMappings: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(runReportObservable).mockReturnValue(of({}) as ReturnType<typeof runReportObservable>);
});

it('leaves an existing hidden format unsaved until the user explicitly selects an allowed replacement', () => {
  const closePanel = jest.fn();
  render(
    <EditScheduledReportForm
      reportDefinitionUuid="fba05caa-7445-4bf4-acfc-d16d655e2500"
      reportRequestUuid="existing-request"
      closePanel={closePanel}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Set schedule' }));
  expect(screen.getByLabelText('Output format')).toHaveValue('');
  expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('button', { name: 'save' }));
  expect(runReportObservable).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText('Output format'), { target: { value: 'csv' } });
  expect(screen.getByRole('button', { name: 'save' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'save' }));
  expect(runReportObservable).toHaveBeenCalledWith(
    expect.objectContaining({ uuid: 'existing-request', renderingMode: { argument: 'csv' } }),
  );
  expect(closePanel).toHaveBeenCalledTimes(1);
});
