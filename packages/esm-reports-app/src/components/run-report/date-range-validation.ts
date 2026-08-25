type ReportParameters = Record<string, unknown>;

function getDateTimestamp(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value).getTime();
  }

  return Number.NaN;
}

export function isReportDateRangeValid(reportParameters: ReportParameters): boolean {
  const { startDate, endDate } = reportParameters;

  // Required-parameter validation handles missing dates separately.
  if (!startDate || !endDate) {
    return true;
  }

  const startTimestamp = getDateTimestamp(startDate);
  const endTimestamp = getDateTimestamp(endDate);

  return Number.isFinite(startTimestamp) && Number.isFinite(endTimestamp) && startTimestamp <= endTimestamp;
}
