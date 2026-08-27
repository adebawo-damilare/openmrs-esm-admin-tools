import type { ReportDefinition } from '../../types/report-definition';
import {
  CANONICAL_ART_LINELIST_REPORT_UUID,
  EXCLUDED_REPORT_NAMES,
  filterAndSortReportDefinitions,
  LEGACY_ART_LINELIST_REPORT_UUID,
} from './report-visibility';

const createReportDefinition = (name: string, uuid: string): ReportDefinition => ({
  uuid,
  name,
  description: '',
  parameters: [],
});

describe('filterAndSortReportDefinitions', () => {
  it('excludes hidden reports and sorts the visible reports alphabetically', () => {
    const reportDefinitions = [
      ...EXCLUDED_REPORT_NAMES.map((name, index) => createReportDefinition(name, `excluded-report-${index}`)),
      createReportDefinition('HTS EXPORT', 'hts-report'),
      createReportDefinition('ARTLinelist Report', CANONICAL_ART_LINELIST_REPORT_UUID),
      createReportDefinition('ART Linelist', LEGACY_ART_LINELIST_REPORT_UUID),
    ];

    expect(filterAndSortReportDefinitions(reportDefinitions).map(({ name }) => name)).toEqual([
      'ART Linelist',
      'HTS EXPORT',
    ]);
  });

  it('does not mutate the report definitions returned by the API', () => {
    const reportDefinitions = [
      createReportDefinition('HTS EXPORT', 'hts-report'),
      createReportDefinition('ARTLinelist Report', CANONICAL_ART_LINELIST_REPORT_UUID),
    ];

    const filteredReportDefinitions = filterAndSortReportDefinitions(reportDefinitions);

    expect(reportDefinitions.map(({ name }) => name)).toEqual(['HTS EXPORT', 'ARTLinelist Report']);
    expect(filteredReportDefinitions.map(({ name }) => name)).toEqual(['ART Linelist', 'HTS EXPORT']);
  });

  it('hides the obsolete ART report by UUID even when its display name looks current', () => {
    const reportDefinitions = [createReportDefinition('ART Linelist', LEGACY_ART_LINELIST_REPORT_UUID)];

    expect(filterAndSortReportDefinitions(reportDefinitions)).toEqual([]);
  });
});
