import type { ReportDesign } from '../../types/report-design';
import {
  CSV_REPORT_RENDERER,
  EXCEL_REPORT_RENDERER,
  filterReportDesigns,
  MISLABELLED_VL_EXCEL_DESIGN_UUID,
  REVIEWED_REPORT_UUIDS,
  VIRAL_LOAD_ELIGIBILITY_REPORT_UUID,
} from './report-output-formats';

const csv: ReportDesign = { uuid: 'csv', name: 'CSV', rendererType: CSV_REPORT_RENDERER };
const excel: ReportDesign = { uuid: 'excel', name: 'Excel', rendererType: EXCEL_REPORT_RENDERER };
const web: ReportDesign = {
  uuid: 'web',
  name: 'Web',
  rendererType: 'org.openmrs.module.reporting.report.renderer.SimpleHtmlReportRenderer',
};

it('scopes the standard-format policy to exactly 25 distinct reviewed identities', () => {
  expect(REVIEWED_REPORT_UUIDS).toHaveLength(25);
  expect(new Set(REVIEWED_REPORT_UUIDS).size).toBe(25);
});

it.each(REVIEWED_REPORT_UUIDS)('offers only the recorded CSV/Excel renderers for reviewed report %s', (reportUuid) => {
  const designs = [csv, web, excel, { uuid: 'pdf', name: 'PDF', rendererType: 'custom.PdfRenderer' }];

  expect(filterReportDesigns(reportUuid, designs)).toEqual([csv, excel]);
  expect(designs).toEqual([csv, web, excel, { uuid: 'pdf', name: 'PDF', rendererType: 'custom.PdfRenderer' }]);
});

it('hides the confirmed misleading VL design by UUID even if its name or renderer is changed', () => {
  for (const rendererType of [CSV_REPORT_RENDERER, EXCEL_REPORT_RENDERER]) {
    const bad = { uuid: MISLABELLED_VL_EXCEL_DESIGN_UUID, name: 'Renamed design', rendererType };
    expect(filterReportDesigns(VIRAL_LOAD_ELIGIBILITY_REPORT_UUID, [bad, csv, excel])).toEqual([csv, excel]);
  }
});

it('does not apply the misleading-design exclusion to a different report identity', () => {
  const design = { uuid: MISLABELLED_VL_EXCEL_DESIGN_UUID, name: 'CSV', rendererType: CSV_REPORT_RENDERER };
  expect(filterReportDesigns(REVIEWED_REPORT_UUIDS[0], [design])).toEqual([design]);
});

it('uses renderer types, not misleading names, to label the standard formats without mutating API data', () => {
  const mislabeled = { ...csv, name: 'Export to Excel' };
  const disguisedWeb = { ...web, name: 'Excel' };

  expect(filterReportDesigns(VIRAL_LOAD_ELIGIBILITY_REPORT_UUID, [mislabeled, disguisedWeb])).toEqual([csv]);
  expect(mislabeled.name).toBe('Export to Excel');
  expect(disguisedWeb.name).toBe('Excel');
});

it('does not guess renderer types from CSV or Excel labels when metadata is absent', () => {
  expect(
    filterReportDesigns(VIRAL_LOAD_ELIGIBILITY_REPORT_UUID, [
      { uuid: 'missing', name: 'Excel' },
      { uuid: 'unknown', name: 'CSV', rendererType: 'custom.UnknownRenderer' },
    ]),
  ).toEqual([]);
});

it('does not invent a fallback when the reviewed report has only hidden formats', () => {
  expect(filterReportDesigns(VIRAL_LOAD_ELIGIBILITY_REPORT_UUID, [web])).toEqual([]);
  expect(filterReportDesigns(VIRAL_LOAD_ELIGIBILITY_REPORT_UUID)).toEqual([]);
});

it('leaves unrelated report identities and their custom formats completely unchanged', () => {
  const designs = [web, { ...csv, name: 'Custom CSV' }, { uuid: 'custom', name: 'Excel' }];
  expect(filterReportDesigns('unrelated-report', designs)).toBe(designs);
});
