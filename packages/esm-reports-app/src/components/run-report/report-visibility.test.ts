import type { ReportDefinition } from '../../types/report-definition';
import {
  CANONICAL_ART_LINELIST_REPORT_UUID,
  EXCLUDED_REPORT_NAMES,
  filterAndSortReportDefinitions,
  LEGACY_ART_LINELIST_REPORT_UUID,
  SI_RADET_REPORT_UUID,
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

  it('hides the SI-RADET report by UUID after its packaged name is applied', () => {
    const reportDefinitions = [createReportDefinition('ART - LINELIST', SI_RADET_REPORT_UUID)];

    expect(filterAndSortReportDefinitions(reportDefinitions)).toEqual([]);
  });

  it('shows reviewed pharmacy and structural audits alongside existing reports, in alphabetical order', () => {
    const definitions = [
      createReportDefinition('Transit Client Linelist', 'transit-report'),
      createReportDefinition('ERROR - PHARMACY FORMS WITHOUT DURATION', '4d8abe9b-1ec7-4dd0-bc2f-727b79b9e7cf'),
      createReportDefinition('HTS EXPORT', 'hts-report'),
      createReportDefinition('ARTLinelist Report', CANONICAL_ART_LINELIST_REPORT_UUID),
      createReportDefinition(
        'ERROR - PHARMACY FORM WITHOUT REGIMEN LINE OR REGIMEN',
        '5165f183-74f8-47ee-b84d-e18432524c13',
      ),
      createReportDefinition('ERROR - INCOMPLETE VIRAL LOAD DATA', 'not-yet-reviewed'),
      createReportDefinition('ERROR - ENCOUNTER WITHOUT ADD PAST VISIT', '64b6148d-12b9-46df-bdba-896ae7504ae5'),
      createReportDefinition('ERROR - DUPLICATE ART START DATES', '5c4758bf-b1be-45ca-8924-daddc3963b24'),
      createReportDefinition('Biometric Line List', 'biometric-not-yet-reviewed'),
      createReportDefinition('HI - Fingerprint Statistics', 'fingerprint-not-yet-reviewed'),
      createReportDefinition('ART Linelist', LEGACY_ART_LINELIST_REPORT_UUID),
    ];

    expect(filterAndSortReportDefinitions(definitions).map(({ name }) => name)).toEqual([
      'ART Linelist',
      'ERROR - DUPLICATE ART START DATES',
      'ERROR - ENCOUNTER WITHOUT ADD PAST VISIT',
      'ERROR - PHARMACY FORM WITHOUT REGIMEN LINE OR REGIMEN',
      'ERROR - PHARMACY FORMS WITHOUT DURATION',
      'HTS EXPORT',
      'Transit Client Linelist',
    ]);
    expect(definitions[3].name).toBe('ARTLinelist Report');
  });

  it('removes only the four reviewed audit names while retaining the other gates', () => {
    expect(EXCLUDED_REPORT_NAMES).toHaveLength(61);
    for (const name of [
      'ERROR - DUPLICATE ART START DATES',
      'ERROR - ENCOUNTER WITHOUT ADD PAST VISIT',
      'ERROR - PHARMACY FORMS WITHOUT DURATION',
      'ERROR - PHARMACY FORM WITHOUT REGIMEN LINE OR REGIMEN',
    ]) {
      expect(EXCLUDED_REPORT_NAMES).not.toContain(name);
    }
    expect(EXCLUDED_REPORT_NAMES).toContain('ERROR - INCOMPLETE VIRAL LOAD DATA');
    expect(EXCLUDED_REPORT_NAMES).toContain('Biometric Line List');
    expect(EXCLUDED_REPORT_NAMES).toContain('HI - Fingerprint Statistics');
  });
});
