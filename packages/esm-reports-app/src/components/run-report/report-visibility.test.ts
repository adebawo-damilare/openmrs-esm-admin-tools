import type { ReportDefinition } from '../../types/report-definition';
import { EXCLUDED_REPORT_NAMES, filterAndSortReportDefinitions } from './report-visibility';

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
      createReportDefinition('ART Linelist', 'art-report'),
    ];

    expect(filterAndSortReportDefinitions(reportDefinitions).map(({ name }) => name)).toEqual([
      'ART Linelist',
      'HTS EXPORT',
    ]);
  });

  it('does not mutate the report definitions returned by the API', () => {
    const reportDefinitions = [
      createReportDefinition('HTS EXPORT', 'hts-report'),
      createReportDefinition('ART Linelist', 'art-report'),
    ];

    filterAndSortReportDefinitions(reportDefinitions);

    expect(reportDefinitions.map(({ name }) => name)).toEqual(['HTS EXPORT', 'ART Linelist']);
  });
});
