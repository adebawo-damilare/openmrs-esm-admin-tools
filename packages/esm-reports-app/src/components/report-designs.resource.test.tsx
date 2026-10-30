import { renderHook } from '@testing-library/react';
import { openmrsFetch } from '@openmrs/esm-framework';
import useSWR from 'swr';
import { useReportDesigns } from './reports.resource';
import { CSV_REPORT_RENDERER, EXCEL_REPORT_RENDERER } from './run-report/report-output-formats';

jest.mock('@openmrs/esm-framework', () => ({ openmrsFetch: jest.fn(), openmrsObservableFetch: jest.fn() }));
jest.mock('swr', () => ({ __esModule: true, default: jest.fn(), useSWRConfig: jest.fn() }));
const swrMock = jest.mocked(useSWR);
const mutate = jest.fn();
const reportUuid = 'fba05caa-7445-4bf4-acfc-d16d655e2500';
const csv = { uuid: 'csv', name: 'CSV', rendererType: CSV_REPORT_RENDERER };
const excel = { uuid: 'excel', name: 'Excel', rendererType: EXCEL_REPORT_RENDERER };
const web = { uuid: 'web', name: 'Web', rendererType: 'custom.HtmlRenderer' };

beforeEach(() => {
  jest.clearAllMocks();
});

it('filters API metadata for both dropdown consumers while preserving the fetch and refresh contract', () => {
  const results = [web, csv, excel];
  swrMock.mockReturnValue({ data: { data: { results } }, mutate, error: undefined, isValidating: false } as never);
  const { result } = renderHook(() => useReportDesigns(reportUuid));

  expect(swrMock).toHaveBeenCalledWith(
    `/ws/rest/v1/reportingrest/reportDesign?reportDefinitionUuid=${reportUuid}`,
    openmrsFetch,
  );
  expect(result.current.reportDesigns).toEqual([csv, excel]);
  expect(result.current.mutateReportDesigns).toBe(mutate);
  expect(results).toEqual([web, csv, excel]);
});

it('shows no selectable formats on missing metadata or API errors, rather than guessing from labels', () => {
  const error = new Error('Unavailable');
  swrMock.mockReturnValue({ mutate, error, isValidating: false } as never);
  const { result } = renderHook(() => useReportDesigns(reportUuid));
  expect(result.current.reportDesigns).toEqual([]);
  expect(result.current.error).toBe(error);
});

it('retains custom formats for unrelated reports and does not fetch before a report is selected', () => {
  const results = [web, csv];
  swrMock.mockReturnValue({ data: { data: { results } }, mutate } as never);
  const { result, rerender } = renderHook(({ uuid }) => useReportDesigns(uuid), {
    initialProps: { uuid: 'unrelated' },
  });
  expect(result.current.reportDesigns).toBe(results);
  rerender({ uuid: '' });
  expect(swrMock).toHaveBeenLastCalledWith(null, openmrsFetch);
});
