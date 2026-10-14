import React from 'react';
import i18next from 'i18next';
import { fireEvent, render, screen } from '@testing-library/react';
import { showSnackbar } from '@openmrs/esm-framework';
import ReportsDataOverview from './reports-data-overview.component';
import en from '../../translations/en.json';

const mockI18n = i18next.createInstance();
const mockMutate = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, defaultValue, options) => mockI18n.t(key, { defaultValue, ...options }) }),
}));
jest.mock('@openmrs/esm-framework', () => ({
  showSnackbar: jest.fn(),
  getCoreTranslation: (key) => key,
  PageHeader: ({ children }) => <header>{children}</header>,
  PageHeaderContent: ({ title, illustration }) => (
    <>
      {illustration}
      {title}
    </>
  ),
}));
jest.mock('./overlay.component', () => () => null);
jest.mock('./report-data-viewer.component', () => () => null);
jest.mock('./report-parameter.component', () => ({
  __esModule: true,
  default: ({ parameter, handleOnChange }) => (
    <label>
      {parameter.label}
      <input name={parameter.name} onChange={handleOnChange} />
    </label>
  ),
}));
jest.mock('./reports.resource', () => ({
  useLocations: () => ({ locations: [] }),
  useNmrsCategories: () => ({ categories: {} }),
  useReportData: () => ({ reportData: undefined, error: undefined, isLoading: false, mutate: mockMutate }),
  useReportDefinitions: () => ({
    reportDefinitions: [
      {
        uuid: 'report',
        name: 'Test report',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'java.lang.String', required: true },
          { name: 'endDate', label: 'End Date', type: 'java.lang.String', required: true },
          { name: 'location', label: 'Facility', type: 'java.lang.String', required: false },
        ],
      },
    ],
  }),
}));

beforeEach(async () => {
  jest.clearAllMocks();
  await mockI18n.init({
    lng: 'en',
    fallbackLng: 'en',
    initImmediate: false,
    resources: {
      en: { translation: en },
      legacy: { translation: { missingParameters: 'Veuillez fournir : {parameters}' } },
    },
  });
});

function chooseReport() {
  render(<ReportsDataOverview />);
  fireEvent.change(screen.getByLabelText('Select Report'), { target: { value: 'report' } });
}

it('interpolates real required labels with i18next and never fetches incomplete input', () => {
  expect(en.missingParameters).toContain('{{parameters}}');
  chooseReport();
  fireEvent.click(screen.getByRole('button', { name: 'Fetch Report' }));
  expect(showSnackbar).toHaveBeenCalledWith(
    expect.objectContaining({
      subtitle: 'Please provide the following parameters: Start Date, End Date',
    }),
  );
  expect(mockMutate).not.toHaveBeenCalled();
});

it('omits optional and already supplied parameters from the message', () => {
  chooseReport();
  fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-10-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Fetch Report' }));
  expect(showSnackbar).toHaveBeenLastCalledWith(
    expect.objectContaining({
      subtitle: 'Please provide the following parameters: End Date',
    }),
  );
  fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2026-10-14' } });
  fireEvent.click(screen.getByRole('button', { name: 'Fetch Report' }));
  expect(mockMutate).toHaveBeenCalledTimes(1);
});

it('also resolves the legacy placeholder in existing non-English catalogs', async () => {
  await mockI18n.changeLanguage('legacy');
  chooseReport();
  fireEvent.click(screen.getByRole('button', { name: 'Fetch Report' }));
  expect(showSnackbar).toHaveBeenCalledWith(
    expect.objectContaining({
      subtitle: 'Veuillez fournir : Start Date, End Date',
    }),
  );
  expect(mockMutate).not.toHaveBeenCalled();
});
