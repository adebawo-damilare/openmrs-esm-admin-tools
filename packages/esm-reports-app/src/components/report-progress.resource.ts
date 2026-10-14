import { useMemo } from 'react';
import useSWR from 'swr';
import { openmrsFetch, useConfig } from '@openmrs/esm-framework';
import type { ConfigObject } from '../config-schema';
import type { ReportProgressInfo } from './report-progress.component';
import { PROCESSING_REPORT_STATUSES } from './report-statuses-constants';

/** Optional NMRS enrichment. Standard Reporting REST remains usable without it. */
export function useReportProgress(reports: Array<{ id: string; status: string }>) {
  const config = useConfig<ConfigObject>();
  const endpoint = config?.reportRequestStatusEndpoint?.replace(/\/$/, '');
  const ids = reports
    .filter((report) => PROCESSING_REPORT_STATUSES.includes(report.status))
    .map((report) => report.id)
    .sort()
    .slice(0, 100);
  const key =
    endpoint?.startsWith('/ws/rest/v1/') && ids.length
      ? `${endpoint}?uuids=${encodeURIComponent(ids.join(','))}`
      : null;
  const { data } = useSWR<{ data: { results: Array<ReportProgressInfo & { uuid: string }> } }>(key, openmrsFetch, {
    refreshInterval: key ? 5000 : 0,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  return useMemo(() => {
    const receivedAt = Date.now();
    const result: Record<string, ReportProgressInfo> = {};
    data?.data?.results?.forEach((info) => {
      result[info.uuid] = { ...info, receivedAt };
    });
    return result;
  }, [data]);
}
