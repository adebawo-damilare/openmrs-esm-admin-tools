import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  reportRequestStatusEndpoint: {
    _type: Type.String,
    _description:
      'Optional batched lifecycle endpoint. Set to an empty string for standard Reporting REST only. NMRS supplies timestamps, recognized log stages and guarded cancellation.',
    _default: '/ws/rest/v1/nmrsreports/requests',
  },
  webPreviewViewReportUrl: {
    _type: Type.String,
    _description:
      'The custom URL that the "View Report" button should open when output format is Web Preview. Use {reportRequestUuid} as placeholder.',
    _default: '',
  },
};

export interface ConfigObject {
  reportRequestStatusEndpoint: string;
  webPreviewViewReportUrl: string;
}
