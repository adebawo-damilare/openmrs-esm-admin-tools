import React from 'react';
import { act, render, screen } from '@testing-library/react';
import ReportProgress, { elapsedTime } from './report-progress.component';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-14T12:02:00Z'));
});
afterEach(() => {
  jest.useRealTimers();
});

it('updates real elapsed time while queued and cleans up its clock', () => {
  const { unmount } = render(<ReportProgress report={{ status: 'REQUESTED', requestDate: '2026-10-14T12:00:00Z' }} />);
  expect(screen.getByText('Waiting in queue')).toBeInTheDocument();
  expect(screen.getByText('Elapsed since request: 0h 2m 0s')).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(1000));
  expect(screen.getByText('Elapsed since request: 0h 2m 1s')).toBeInTheDocument();
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it('separates processing time from time spent in queue', () => {
  render(
    <ReportProgress
      report={{
        status: 'PROCESSING',
        requestDate: '2026-10-14T12:00:00Z',
        evaluateStartDatetime: '2026-10-14T12:01:00Z',
      }}
    />,
  );
  expect(screen.getByText('Evaluating report data')).toBeInTheDocument();
  expect(screen.getByText('Processing elapsed: 0h 1m 0s')).toBeInTheDocument();
});

it('uses a known backend stage and compensates for browser/server clock differences', () => {
  render(
    <ReportProgress
      report={{
        status: 'PROCESSING',
        stage: 'WRITING_OUTPUT',
        requestDate: 1000,
        serverTime: 61000,
        receivedAt: Date.now(),
      }}
    />,
  );
  expect(screen.getByText('Writing output')).toBeInTheDocument();
  expect(screen.getByText('Elapsed since request: 0h 1m 0s')).toBeInTheDocument();
  expect(screen.queryByText(/%/)).not.toBeInTheDocument();
});

it('does not invent a start time or display elapsed time for finished reports', () => {
  expect(elapsedTime(undefined, Date.now())).toBeNull();
  expect(elapsedTime('invalid', Date.now())).toBeNull();
  const { container } = render(<ReportProgress report={{ status: 'COMPLETED' }} />);
  expect(container).toBeEmptyDOMElement();
  expect(jest.getTimerCount()).toBe(0);
});
