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

  it('shows reviewed audits and fingerprint statistics alongside existing reports, in alphabetical order', () => {
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
      createReportDefinition('Biometric Line List', '95dee752-096e-441c-be3e-6141f33d8082'),
      createReportDefinition('HI - Fingerprint Statistics', '6001512e-8cd3-4f5c-9c86-02f9989effb1'),
      createReportDefinition('SCHEDULED APPOINTMENT', '2bcc0d06-8120-4d85-99a7-530675b080e6'),
      createReportDefinition('MISSED APPOINTMENT', '319982d1-68dd-45f6-a0ef-ef1dc4e883dd'),
      createReportDefinition('Active Patient By Regimen', '2a1fc43b-fdb9-478b-a8fd-2b0c00e2e1de'),
      createReportDefinition('Pediatric Regimen Analysis By Weight', '8ff55386-a22d-4c68-8389-620301d40dc5'),
      createReportDefinition('ART Linelist', LEGACY_ART_LINELIST_REPORT_UUID),
    ];

    expect(filterAndSortReportDefinitions(definitions).map(({ name }) => name)).toEqual([
      'Active Patient By Regimen',
      'ART Linelist',
      'Biometric Line List',
      'ERROR - DUPLICATE ART START DATES',
      'ERROR - ENCOUNTER WITHOUT ADD PAST VISIT',
      'ERROR - PHARMACY FORM WITHOUT REGIMEN LINE OR REGIMEN',
      'ERROR - PHARMACY FORMS WITHOUT DURATION',
      'HI - Fingerprint Statistics',
      'HTS EXPORT',
      'MISSED APPOINTMENT',
      'Pediatric Regimen Analysis By Weight',
      'SCHEDULED APPOINTMENT',
      'Transit Client Linelist',
    ]);
    expect(definitions[3].name).toBe('ARTLinelist Report');
  });

  it('removes only the ten reviewed names while retaining the other gates', () => {
    expect(EXCLUDED_REPORT_NAMES).toHaveLength(55);
    for (const name of [
      'ERROR - DUPLICATE ART START DATES',
      'ERROR - ENCOUNTER WITHOUT ADD PAST VISIT',
      'ERROR - PHARMACY FORMS WITHOUT DURATION',
      'ERROR - PHARMACY FORM WITHOUT REGIMEN LINE OR REGIMEN',
      'HI - Fingerprint Statistics',
      'Biometric Line List',
      'SCHEDULED APPOINTMENT',
      'MISSED APPOINTMENT',
      'Active Patient By Regimen',
      'Pediatric Regimen Analysis By Weight',
    ]) {
      expect(EXCLUDED_REPORT_NAMES).not.toContain(name);
    }
    expect(EXCLUDED_REPORT_NAMES).toContain('ERROR - INCOMPLETE VIRAL LOAD DATA');
  });

  it('preserves fingerprint statistics identity and leaves its source definition untouched', () => {
    const fingerprintReport = createReportDefinition(
      'HI - Fingerprint Statistics',
      '6001512e-8cd3-4f5c-9c86-02f9989effb1',
    );
    const definitions = [
      createReportDefinition('ERROR - INCOMPLETE VIRAL LOAD DATA', 'still-hidden'),
      fingerprintReport,
    ];

    expect(filterAndSortReportDefinitions(definitions)).toEqual([fingerprintReport]);
    expect(definitions).toHaveLength(2);
    expect(definitions[1]).toBe(fingerprintReport);
  });

  it('shows the reviewed biometric report without mutating its identity or exposing the viral-load backlog', () => {
    const biometricReport = createReportDefinition('Biometric Line List', '95dee752-096e-441c-be3e-6141f33d8082');
    const definitions = [biometricReport, createReportDefinition('ERROR - INCOMPLETE VIRAL LOAD DATA', 'backlog')];

    expect(filterAndSortReportDefinitions(definitions)).toEqual([biometricReport]);
    expect(definitions).toHaveLength(2);
    expect(definitions[0]).toBe(biometricReport);
  });

  it('shows both reviewed appointment reports with stable identities and alphabetical ordering', () => {
    const scheduled = createReportDefinition('SCHEDULED APPOINTMENT', '2bcc0d06-8120-4d85-99a7-530675b080e6');
    const missed = createReportDefinition('MISSED APPOINTMENT', '319982d1-68dd-45f6-a0ef-ef1dc4e883dd');
    const definitions = [scheduled, missed];

    expect(filterAndSortReportDefinitions(definitions)).toEqual([missed, scheduled]);
    expect(definitions).toHaveLength(2);
    expect(definitions[0]).toBe(scheduled);
    expect(definitions[1]).toBe(missed);
  });

  it('shows reviewed missed appointments without exposing the incomplete viral-load backlog', () => {
    const missed = createReportDefinition('MISSED APPOINTMENT', '319982d1-68dd-45f6-a0ef-ef1dc4e883dd');
    const definitions = [createReportDefinition('ERROR - INCOMPLETE VIRAL LOAD DATA', 'backlog'), missed];

    expect(filterAndSortReportDefinitions(definitions)).toEqual([missed]);
    expect(definitions[1]).toBe(missed);
    expect(definitions).toHaveLength(2);
  });

  it('shows the reviewed active-regimen snapshot without exposing TXNEW or mutating identity', () => {
    const active = createReportDefinition('Active Patient By Regimen', '2a1fc43b-fdb9-478b-a8fd-2b0c00e2e1de');
    const definitions = [
      createReportDefinition('Regimen Analysis by TXNEW', 'txnew-backlog'),
      createReportDefinition('ERROR - INCOMPLETE VIRAL LOAD DATA', 'viral-backlog'),
      active,
    ];

    expect(filterAndSortReportDefinitions(definitions)).toEqual([active]);
    expect(definitions[2]).toBe(active);
    expect(definitions).toHaveLength(3);
  });

  it('shows the reviewed pediatric report and preserves historical trailing-space names without exposing backlogged reports', () => {
    const pediatric = createReportDefinition(
      'Pediatric Regimen Analysis By Weight ',
      '8ff55386-a22d-4c68-8389-620301d40dc5',
    );
    const active = createReportDefinition('Active Patient By Regimen', '2a1fc43b-fdb9-478b-a8fd-2b0c00e2e1de');
    const definitions = [
      pediatric,
      createReportDefinition('Regimen Analysis by TXNEW', 'txnew-backlog'),
      createReportDefinition('ERROR - INCOMPLETE VIRAL LOAD DATA', 'viral-backlog'),
      active,
    ];

    expect(filterAndSortReportDefinitions(definitions)).toEqual([active, pediatric]);
    expect(definitions[0]).toBe(pediatric);
    expect(definitions[0].name).toBe('Pediatric Regimen Analysis By Weight ');
    expect(definitions).toHaveLength(4);
  });
});
