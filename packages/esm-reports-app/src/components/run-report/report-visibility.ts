import type { ReportDefinition } from '../../types/report-definition';

export const CANONICAL_ART_LINELIST_REPORT_UUID = 'fba05caa-7445-4bf4-acfc-d16d655e2500';
export const LEGACY_ART_LINELIST_REPORT_UUID = '786688c2-2f13-481b-9459-99dd7e2f6899';
export const SI_RADET_REPORT_UUID = '45af899b-f6d2-4a46-b89a-e6b5696dd7de';
export const EXCLUDED_REPORT_UUIDS = [LEGACY_ART_LINELIST_REPORT_UUID, SI_RADET_REPORT_UUID] as const;

// Remove a report name from this array when it is ready to appear in the Run report list.
export const EXCLUDED_REPORT_NAMES = [
  'AHD Line List',
  'Child Birth Registration',
  'Child Follow Up Report',
  'CLINIC VISIT',
  'Combined ART Indicators for Monthly & Periodic Reports',
  'Combined HTS Indicators for Monthly & Periodic Reports',
  'Combined PMTCT Indicators for Monthly & Periodic Reports',
  'CTD-Linelist',
  'Data Entry Statistics',
  'Drug Consumption By Date',
  'Drug Consumption By Month',
  'ERegister',
  'ERROR - INCOMPLETE VIRAL LOAD DATA',
  'EXITS',
  'Facility Lab Report',
  'Fatima Shaibu',
  'GENERAL ANTENATAL EXPORT',
  'HTS_TST',
  'LAB - Lab Report',
  'LAB - Viral Loads',
  'List of Diagnosis',
  'List of New Patient Registrations',
  'List of Patients affected by this Diagnosis',
  'List of Patients for this Provider',
  'List of Providers',
  'List of Users',
  'Lost to FollowUp',
  'Maternal Cohort',
  'NCD Report',
  'Number of All Admissions',
  'Number of All Discharges',
  'Number of All Transfers',
  'Number of Discharges',
  'Number of Patient Registrations',
  'Number of Transfers',
  'Number of Visit Notes',
  'Number of Visits',
  'OTZ Line List',
  'Patient Ever Enrolled',
  'Patient Line Listing',
  'PHARMACY - DRUG EXPORT',
  'PMTCT_Number of new ANC Clients',
  'PMTCT_Number of new ANC Clients tested for syphilis',
  'PVLS Report',
  'Report Collins',
  'SI - RADET',
  'Simple row per patient report',
  'test_0',
  'Tx_CURR',
  'Tx_NEW',
  'VIRAL LOAD ELIGIBILITY REPORT',
  'VIRAL LOAD REPORT',
  'Viral Load Eligibility',
  'Viral Load Eligibility 2.0',
] as const;

const excludedReportNames = new Set<string>(EXCLUDED_REPORT_NAMES);
const excludedReportUuids = new Set<string>(EXCLUDED_REPORT_UUIDS);

function useCanonicalReportName(reportDefinition: ReportDefinition): ReportDefinition {
  if (reportDefinition.uuid === CANONICAL_ART_LINELIST_REPORT_UUID && reportDefinition.name !== 'ART Linelist') {
    return { ...reportDefinition, name: 'ART Linelist' };
  }

  return reportDefinition;
}

export function filterAndSortReportDefinitions(reportDefinitions: ReportDefinition[] = []): ReportDefinition[] {
  return reportDefinitions
    .filter(
      (reportDefinition) =>
        !excludedReportUuids.has(reportDefinition.uuid) && !excludedReportNames.has(reportDefinition.name.trim()),
    )
    .map(useCanonicalReportName)
    .sort((firstReport, secondReport) =>
      firstReport.name.localeCompare(secondReport.name, undefined, { sensitivity: 'base' }),
    );
}
