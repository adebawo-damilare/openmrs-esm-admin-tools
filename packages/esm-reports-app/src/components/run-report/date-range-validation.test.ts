import { isReportDateRangeValid } from './date-range-validation';

describe('isReportDateRangeValid', () => {
  it('accepts a start date before the end date', () => {
    expect(
      isReportDateRangeValid({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-07-31'),
      }),
    ).toBe(true);
  });

  it('accepts the same start and end date', () => {
    expect(isReportDateRangeValid({ startDate: '2026-07-31', endDate: '2026-07-31' })).toBe(true);
  });

  it('rejects an end date before the start date', () => {
    expect(isReportDateRangeValid({ startDate: '2026-08-01', endDate: '2026-07-31' })).toBe(false);
  });

  it('leaves missing-date validation to the required-parameter check', () => {
    expect(isReportDateRangeValid({ startDate: '2026-08-01' })).toBe(true);
  });

  it('rejects invalid date values', () => {
    expect(isReportDateRangeValid({ startDate: 'Invalid Date', endDate: '2026-07-31' })).toBe(false);
  });
});
