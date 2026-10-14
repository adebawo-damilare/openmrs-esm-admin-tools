import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PROCESSING_REPORT_STATUSES } from './report-statuses-constants';
import styles from './reports.scss';

export interface ReportProgressInfo {
  status: string;
  requestDate?: string | number;
  evaluateStartDatetime?: string | number;
  evaluateCompleteDatetime?: string | number;
  renderCompleteDatetime?: string | number;
  stage?: string;
  serverTime?: number;
  receivedAt?: number;
}

export function elapsedTime(start: string | number | undefined, now: number): string | null {
  if (start == null || start === '') return null;
  const timestamp = new Date(start).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`;
}

const ReportProgress: React.FC<{ report: ReportProgressInfo }> = ({ report }) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now);
  const active = PROCESSING_REPORT_STATUSES.includes(report.status);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  if (!active) return null;
  const serverNow =
    report.serverTime != null && report.receivedAt != null ? report.serverTime + now - report.receivedAt : now;
  const elapsed = elapsedTime(report.requestDate, serverNow);
  const processing = elapsedTime(report.evaluateStartDatetime, serverNow);
  const stages = {
    QUEUED: t('waitingInQueue', 'Waiting in queue'),
    PROCESSING: t('processingReport', 'Processing report'),
    EVALUATING_COHORT: t('evaluatingCohort', 'Evaluating cohort'),
    EVALUATING: t('evaluatingReportData', 'Evaluating report data'),
    RENDERING: t('generatingReportOutput', 'Generating output'),
    WRITING_OUTPUT: t('writingReportOutput', 'Writing output'),
    CACHING: t('cachingReportResults', 'Caching results'),
    POST_PROCESSING: t('finalReportProcessing', 'Final processing'),
  };
  const stage =
    report.stage ||
    (report.status === 'REQUESTED'
      ? 'QUEUED'
      : report.renderCompleteDatetime
        ? 'POST_PROCESSING'
        : report.evaluateCompleteDatetime
          ? 'RENDERING'
          : report.evaluateStartDatetime
            ? 'EVALUATING'
            : 'PROCESSING');
  return (
    <div className={styles.reportProgress}>
      <div>{stages[stage] || stages.PROCESSING}</div>
      {elapsed && (
        <div>
          {t('elapsedSinceRequest', 'Elapsed since request')}: {elapsed}
        </div>
      )}
      {processing && (
        <div>
          {t('processingElapsed', 'Processing elapsed')}: {processing}
        </div>
      )}
    </div>
  );
};

export default ReportProgress;
