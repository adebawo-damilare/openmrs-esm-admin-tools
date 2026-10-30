import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { of } from 'rxjs';
import { closeOverlay } from '../../hooks/useOverlay';
import { runReportObservable, useReportDesigns } from '../reports.resource';
import RunReportForm from './run-report-form.component';

jest.mock('@openmrs/esm-framework', () => ({
  showSnackbar: jest.fn(),
  useLayoutType: () => 'desktop',
  OpenmrsDatePicker: ({ id, labelText, onChange, value }) => (
    <label>
      {labelText}
      <input
        id={id}
        type="date"
        value={value?.toISOString?.().slice(0, 10) ?? ''}
        onChange={(event) => onChange(event.target.value ? new Date(`${event.target.value}T00:00:00Z`) : null)}
      />
    </label>
  ),
}));
jest.mock('../../hooks/useOverlay', () => ({ closeOverlay: jest.fn() }));
jest.mock('../reports.resource', () => ({
  runReportObservable: jest.fn(),
  useLocations: () => ({ locations: [] }),
  useNmrsCategories: () => ({ categories: {} }),
  useReportDesigns: jest.fn(),
  useReportDefinitions: () => ({
    reportDefinitions: [
      {
        uuid: 'fba05caa-7445-4bf4-acfc-d16d655e2500',
        name: 'ART Linelist',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'java.util.Date', required: true },
          { name: 'endDate', label: 'End Date', type: 'java.util.Date', required: true },
        ],
      },
      { uuid: '65dba83d-b268-48af-a7ee-dd1626cd37a1', name: 'HTS EXPORT', parameters: [] },
    ],
  }),
}));
const mockMutateDesigns = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useReportDesigns).mockReturnValue({
    reportDesigns: [{ uuid: 'excel', name: 'Excel' }],
    mutateReportDesigns: mockMutateDesigns,
    error: undefined,
    isValidating: false,
  });
  jest.mocked(runReportObservable).mockReturnValue(of({}) as ReturnType<typeof runReportObservable>);
});

function chooseReport() {
  fireEvent.change(screen.getByLabelText('Report'), { target: { value: 'fba05caa-7445-4bf4-acfc-d16d655e2500' } });
  fireEvent.change(screen.getByLabelText('Output format'), { target: { value: 'excel' } });
}

it('keeps actions outside the scrollable, evenly spaced form content', () => {
  render(<RunReportForm closePanel={jest.fn()} />);
  const content = screen.getByRole('group', { name: 'Report parameters' });
  expect(content).toContainElement(screen.getByLabelText('Filter by Category'));
  expect(content).toContainElement(screen.getByLabelText('Report'));
  expect(content).not.toContainElement(screen.getByRole('button', { name: 'Run' }));
  expect(
    within(screen.getByRole('group', { name: 'Report actions' })).getByRole('button', { name: 'Run' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(closeOverlay).toHaveBeenCalledTimes(1);
});

it('preserves required dates and reversed-date validation with the new layout', () => {
  render(<RunReportForm closePanel={jest.fn()} />);
  chooseReport();
  expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-10-14' } });
  fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2026-10-01' } });
  expect(screen.getByRole('alert')).toHaveTextContent('End date must be on or after start date.');
  expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2026-10-14' } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Run' })).toBeEnabled();
});

it('submits the same NMRS report and date parameters', async () => {
  const closePanel = jest.fn();
  render(<RunReportForm closePanel={closePanel} />);
  chooseReport();
  fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-10-01' } });
  fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2026-10-14' } });
  fireEvent.click(screen.getByRole('button', { name: 'Run' }));
  expect(runReportObservable).toHaveBeenCalledWith(
    expect.objectContaining({
      reportDefinition: {
        parameterizable: { uuid: 'fba05caa-7445-4bf4-acfc-d16d655e2500' },
        parameterMappings: { startDate: new Date('2026-10-01T00:00:00Z'), endDate: new Date('2026-10-14T00:00:00Z') },
      },
      renderingMode: { argument: 'excel' },
    }),
  );
  await waitFor(() => expect(closePanel).toHaveBeenCalledTimes(1));
});

it('blocks submission if a previously selected design is no longer selectable', () => {
  const { rerender } = render(<RunReportForm closePanel={jest.fn()} />);
  chooseReport();
  fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-10-01' } });
  fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2026-10-14' } });
  expect(screen.getByRole('button', { name: 'Run' })).toBeEnabled();

  jest.mocked(useReportDesigns).mockReturnValue({
    reportDesigns: [],
    mutateReportDesigns: mockMutateDesigns,
    error: undefined,
    isValidating: false,
  });
  rerender(<RunReportForm closePanel={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('button', { name: 'Run' }));
  expect(runReportObservable).not.toHaveBeenCalled();
});

it('clears the previous format when the selected report changes', () => {
  render(<RunReportForm closePanel={jest.fn()} />);
  chooseReport();
  fireEvent.change(screen.getByLabelText('Report'), { target: { value: '65dba83d-b268-48af-a7ee-dd1626cd37a1' } });
  expect(screen.getByLabelText('Output format')).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();
  expect(runReportObservable).not.toHaveBeenCalled();
});
