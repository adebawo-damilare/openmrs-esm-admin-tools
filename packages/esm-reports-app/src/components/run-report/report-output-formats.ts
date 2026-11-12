import type { ReportDesign } from '../../types/report-design';

export const CSV_REPORT_RENDERER = 'org.openmrs.module.reporting.report.renderer.CsvReportRenderer';
export const EXCEL_REPORT_RENDERER = 'org.openmrs.module.reporting.report.renderer.XlsReportRenderer';
export const APPOINTMENT_EXCEL_REPORT_RENDERER = 'org.openmrs.module.nmrsreports.report.AppointmentExcelReportRenderer';
export const VIRAL_LOAD_ELIGIBILITY_REPORT_UUID = '9d363fa4-e132-4a39-962f-c9872e285172';
export const MISLABELLED_VL_EXCEL_DESIGN_UUID = '4af1952d-5443-40aa-b804-fa7c68469a5a';

// Scope this NMRS policy by identity: unrelated/custom reports keep their configured formats.
export const REVIEWED_REPORT_UUIDS = [
  '714d99ef-7c4d-4b50-8e92-5fc00e8b0ab5', // AHD Line List
  'fba05caa-7445-4bf4-acfc-d16d655e2500', // ART Linelist (both PEPFAR and GF)
  '95dee752-096e-441c-be3e-6141f33d8082', // Biometric Line List
  '62d95963-bed4-41b3-ab15-0492d04b98d3', // CLINIC VISIT
  'd2900ea3-0bb0-42df-9aa7-f04a910977b4', // Drug Consumption By Date
  '4a9a49af-9c4e-42ae-8e9c-0727cf104a92', // Drug Consumption By Month
  'd39509bc-4881-11e7-a919-92ebcb67fe33', // PHARMACY - DRUG EXPORT
  '5c4758bf-b1be-45ca-8924-daddc3963b24', // ERROR - DUPLICATE ART START DATES
  '64b6148d-12b9-46df-bdba-896ae7504ae5', // ERROR - ENCOUNTER WITHOUT ADD PAST VISIT
  '6001512e-8cd3-4f5c-9c86-02f9989effb1', // HI - Fingerprint Statistics
  '65dba83d-b268-48af-a7ee-dd1626cd37a1', // HTS EXPORT
  '319982d1-68dd-45f6-a0ef-ef1dc4e883dd', // MISSED APPOINTMENT
  '827ece1f-98f9-4d58-9a0a-9a013f41cb25', // NCD Report
  'ceea9066-bbef-4dee-bc21-a8ae4b6533b9', // National PMTCT Export (current form only)
  'cbc1c600-0535-4158-9101-c31ffb4a5ead', // OTZ Line List
  '767e60b7-5671-4d0d-850e-934a1b48474a', // Patient Ever Enrolled
  '5165f183-74f8-47ee-b84d-e18432524c13', // ERROR - PHARMACY FORM WITHOUT REGIMEN LINE OR REGIMEN
  '4d8abe9b-1ec7-4dd0-bc2f-727b79b9e7cf', // ERROR - PHARMACY FORMS WITHOUT DURATION
  '2a1fc43b-fdb9-478b-a8fd-2b0c00e2e1de', // Active Patient By Regimen
  '8ff55386-a22d-4c68-8389-620301d40dc5', // Pediatric Regimen Analysis By Weight
  'dd8f326d-bc8a-4808-94fd-c82f1e5f598a', // Regimen Analysis by TXNEW
  '2bcc0d06-8120-4d85-99a7-530675b080e6', // SCHEDULED APPOINTMENT
  '80dc533b-1eb6-460d-b9c7-1e461f01b888', // Transit Client Linelist
  'a8fb8071-79c0-4bfc-982d-2a2a1b6b8db1', // Tx_NEW
  VIRAL_LOAD_ELIGIBILITY_REPORT_UUID,
  '3ae768dd-4acb-4ce3-b846-693e9dfeb285', // LAB - Viral Loads
] as const;

const reviewedReportUuids = new Set<string>(REVIEWED_REPORT_UUIDS);
const standardFormatNames = new Map([
  [CSV_REPORT_RENDERER, 'CSV'],
  [EXCEL_REPORT_RENDERER, 'Excel'],
]);
const appointmentExcelDesigns = new Map([
  ['2bcc0d06-8120-4d85-99a7-530675b080e6', 'ad664559-ed92-4e38-9123-197813d4ae57'],
  ['319982d1-68dd-45f6-a0ef-ef1dc4e883dd', '8943bea2-be11-4bb1-ba2a-39d906ed011d'],
]);

/** Presentation-only: never retires designs or alters previously saved report requests. */
export function filterReportDesigns(reportUuid: string, designs: ReportDesign[] = []): ReportDesign[] {
  if (!reviewedReportUuids.has(reportUuid)) {
    return designs;
  }

  return designs.flatMap((design) => {
    if (reportUuid === VIRAL_LOAD_ELIGIBILITY_REPORT_UUID && design.uuid === MISLABELLED_VL_EXCEL_DESIGN_UUID) {
      return [];
    }
    const isAppointmentExcel =
      design.rendererType === APPOINTMENT_EXCEL_REPORT_RENDERER &&
      appointmentExcelDesigns.get(reportUuid) === design.uuid;
    const name = isAppointmentExcel ? 'Excel' : standardFormatNames.get(design.rendererType);
    return name ? [{ ...design, name }] : [];
  });
}
