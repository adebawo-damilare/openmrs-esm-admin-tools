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
      createReportDefinition('Regimen Analysis by TXNEW', 'dd8f326d-bc8a-4808-94fd-c82f1e5f598a'),
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
      'Regimen Analysis by TXNEW',
      'SCHEDULED APPOINTMENT',
      'Transit Client Linelist',
    ]);
    expect(definitions[3].name).toBe('ARTLinelist Report');
  });

  it('removes only the sixteen reviewed names while retaining the other gates', () => {
    expect(EXCLUDED_REPORT_NAMES).toHaveLength(49);
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
      'Regimen Analysis by TXNEW',
      'PHARMACY - DRUG EXPORT',
      'Drug Consumption By Date',
      'Drug Consumption By Month',
      'OTZ Line List',
      'AHD Line List',
    ]) {
      expect(EXCLUDED_REPORT_NAMES).not.toContain(name);
    }
    expect(EXCLUDED_REPORT_NAMES).toContain('ERROR - INCOMPLETE VIRAL LOAD DATA');
  });

  it('shows reviewed OTZ and AHD linelists while keeping unrelated reports gated', () => {
    const definitions = [
      createReportDefinition('OTZ Line List', 'cbc1c600-0535-4158-9101-c31ffb4a5ead'),
      createReportDefinition('AHD Line List', '714d99ef-7c4d-4b50-8e92-5fc00e8b0ab5'),
      createReportDefinition('Tx_NEW', 'still-hidden'),
      createReportDefinition('ART - LINELIST', SI_RADET_REPORT_UUID),
    ];

    expect(filterAndSortReportDefinitions(definitions).map(({ name }) => name)).toEqual([
      'AHD Line List',
      'OTZ Line List',
    ]);
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

  it('shows the reviewed active-regimen snapshot without exposing the unreviewed Tx_NEW linelist or mutating identity', () => {
    const active = createReportDefinition('Active Patient By Regimen', '2a1fc43b-fdb9-478b-a8fd-2b0c00e2e1de');
    const definitions = [
      createReportDefinition('Tx_NEW', 'txnew-linelist-backlog'),
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
      createReportDefinition('Tx_NEW', 'txnew-linelist-backlog'),
      createReportDefinition('ERROR - INCOMPLETE VIRAL LOAD DATA', 'viral-backlog'),
      active,
    ];

    expect(filterAndSortReportDefinitions(definitions)).toEqual([active, pediatric]);
    expect(definitions[0]).toBe(pediatric);
    expect(definitions[0].name).toBe('Pediatric Regimen Analysis By Weight ');
    expect(definitions).toHaveLength(4);
  });

  it('shows the reviewed TXNEW regimen summary without exposing the separate Tx_NEW linelist or viral-load backlog', () => {
    const txnew = createReportDefinition('Regimen Analysis by TXNEW', 'dd8f326d-bc8a-4808-94fd-c82f1e5f598a');
    const definitions = [
      createReportDefinition('Tx_NEW', 'separate-linelist'),
      txnew,
      createReportDefinition('ERROR - INCOMPLETE VIRAL LOAD DATA', 'viral-backlog'),
    ];

    expect(filterAndSortReportDefinitions(definitions)).toEqual([txnew]);
    expect(definitions[1]).toBe(txnew);
    expect(definitions).toHaveLength(3);
  });

  it('shows the three reviewed pharmacy reports in alphabetical order without mutating their identities', () => {
    const drugExport = createReportDefinition('PHARMACY - DRUG EXPORT', 'd39509bc-4881-11e7-a919-92ebcb67fe33');
    const daily = createReportDefinition('Drug Consumption By Date', 'd2900ea3-0bb0-42df-9aa7-f04a910977b4');
    const monthly = createReportDefinition('Drug Consumption By Month', '4a9a49af-9c4e-42ae-8e9c-0727cf104a92');
    const definitions = [drugExport, monthly, daily];

    expect(filterAndSortReportDefinitions(definitions)).toEqual([daily, monthly, drugExport]);
    expect(definitions).toEqual([drugExport, monthly, daily]);
    expect(definitions[0]).toBe(drugExport);
  });

  it('keeps unreviewed drug-adjacent reports and duplicate ART UUIDs hidden alongside pharmacy exports', () => {
    const drugExport = createReportDefinition('PHARMACY - DRUG EXPORT', 'd39509bc-4881-11e7-a919-92ebcb67fe33');
    const definitions = [
      createReportDefinition('ERROR - INCOMPLETE VIRAL LOAD DATA', 'viral-backlog'),
      createReportDefinition('Tx_NEW', 'separate-txnew'),
      createReportDefinition('ART Linelist', LEGACY_ART_LINELIST_REPORT_UUID),
      createReportDefinition('ART - LINELIST', SI_RADET_REPORT_UUID),
      drugExport,
    ];

    expect(filterAndSortReportDefinitions(definitions)).toEqual([drugExport]);
    expect(definitions).toHaveLength(5);
  });

  it('accepts trailing-space pharmacy names without changing the API objects', () => {
    const daily = createReportDefinition('Drug Consumption By Date ', 'd2900ea3-0bb0-42df-9aa7-f04a910977b4');

    expect(filterAndSortReportDefinitions([daily])).toEqual([daily]);
    expect(daily.name).toBe('Drug Consumption By Date ');
  });
});
