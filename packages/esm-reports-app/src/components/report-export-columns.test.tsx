import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { showModal } from '@openmrs/esm-framework';
import ReportExportColumnsModal from './report-export-columns.modal';
import ReportDataViewer from './report-data-viewer.component';
import routes from '../routes.json';

jest.mock('@openmrs/esm-framework', () => ({
  getCoreTranslation: (key) => (key === 'cancel' ? 'Cancel' : key),
  showModal: jest.fn(),
  useLayoutType: () => 'desktop',
  isDesktop: () => true,
  formatDatetime: (date) => date.toISOString(),
  parseDate: (value) => new Date(value),
}));

const columns = [
  { name: 'first', label: 'First name' },
  { name: 'last', label: 'Last name' },
];
const reportData = {
  definition: { name: 'Synthetic report' },
  dataSets: [
    {
      metadata: { columns },
      rows: Array.from({ length: 12 }, (_, i) => ({ first: `First ${i + 1}`, last: `Last ${i + 1}` })),
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(showModal).mockReturnValue(jest.fn());
});

it('registers the framework modal lifecycle in routes', () => {
  expect(routes.modals).toContainEqual({ name: 'report-export-columns-modal', component: 'reportExportColumnsModal' });
});

it('publishes changes without mutating props and closes on Cancel without exporting', () => {
  const close = jest.fn(),
    onExport = jest.fn(),
    onSelectionChange = jest.fn();
  const selected = { first: true, last: true };
  render(
    <ReportExportColumnsModal
      columns={columns}
      selectedColumns={selected}
      close={close}
      onExport={onExport}
      onSelectionChange={onSelectionChange}
    />,
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Last name' }));
  expect(onSelectionChange).toHaveBeenCalledWith({ first: true, last: false });
  expect(selected.last).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(onExport).not.toHaveBeenCalled();
});

it('exports the current selection and prevents an empty export', () => {
  const close = jest.fn(),
    onExport = jest.fn();
  render(
    <ReportExportColumnsModal
      columns={columns}
      selectedColumns={{ first: false, last: false }}
      close={close}
      onExport={onExport}
      onSelectionChange={jest.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Last name' }));
  fireEvent.click(screen.getByRole('button', { name: 'Export' }));
  expect(onExport).toHaveBeenCalledWith({ first: false, last: true });
  expect(close).toHaveBeenCalledTimes(1);
});

it('preserves cancelled selections on reopening and disposes on unmount', () => {
  const dispose = jest.fn();
  jest.mocked(showModal).mockReturnValue(dispose);
  const { unmount } = render(<ReportDataViewer reportData={reportData} />);
  fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
  const props = jest.mocked(showModal).mock.calls[0][1] as any;
  act(() => props.onSelectionChange({ first: true, last: false }));
  fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
  expect(showModal).toHaveBeenLastCalledWith(
    'report-export-columns-modal',
    expect.objectContaining({
      selectedColumns: { first: true, last: false },
    }),
  );
  expect(dispose).toHaveBeenCalledTimes(1);
  unmount();
  expect(dispose).toHaveBeenCalledTimes(2);
});

it('exports selected columns across all pages and releases the download URL', async () => {
  URL.createObjectURL = jest.fn(() => 'blob:report-test');
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  try {
    render(<ReportDataViewer reportData={reportData} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    const props = jest.mocked(showModal).mock.calls[0][1] as any;
    act(() => props.onExport({ first: false, last: true }));
    const blob = jest.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const csv = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(blob);
    });
    expect(csv.split('\n')).toHaveLength(13);
    expect(csv).toBe('Last name\n' + Array.from({ length: 12 }, (_, i) => `Last ${i + 1}`).join('\n'));
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:report-test');
  } finally {
    click.mockRestore();
  }
});

it('does not offer export without column metadata', () => {
  render(<ReportDataViewer reportData={undefined} />);
  expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
});
