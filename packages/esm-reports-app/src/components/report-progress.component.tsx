import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PROCESSING_REPORT_STATUSES } from './report-statuses-constants';
import ReportStatus from './report-status.component';
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
  const serverNow =
    report.serverTime != null && report.receivedAt != null ? report.serverTime + now - report.receivedAt : now;
  const completed = report.status === 'COMPLETED' || report.status === 'SAVED';
  const finishedAt = report.renderCompleteDatetime ?? report.evaluateCompleteDatetime;
  const end = completed && finishedAt != null ? new Date(finishedAt).getTime() : undefined;
  const start = report.requestDate != null && report.requestDate !== '' ? new Date(report.requestDate).getTime() : NaN;
  const hasFinishedDuration =
    completed && end != null && Number.isFinite(end) && Number.isFinite(start) && end >= start;
  const elapsed = active
    ? elapsedTime(report.requestDate, serverNow)
    : hasFinishedDuration
      ? elapsedTime(report.requestDate, end)
      : null;
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
  const details: string[] = [];
  if (active) details.push(stages[stage] || stages.PROCESSING);
  if (elapsed) details.push(`${t('elapsedSinceRequest', 'Elapsed since request')}: ${elapsed}`);
  if (active && processing) details.push(`${t('processingElapsed', 'Processing elapsed')}: ${processing}`);
  if (completed && end != null && Number.isFinite(end))
    details.push(`${t('reportOutputReady', 'Output ready')}: ${new Date(end).toLocaleString()}`);
  return (
    <div className={styles.compactReportStatus} title={details.join('\n')}>
      <ReportStatus status={report.status} />
      {elapsed && <span>: {elapsed}</span>}
    </div>
  );
};

export default ReportProgress;
