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
  expect(screen.getByText('Queued')).toHaveTextContent('Queued: 0h 2m 0s');
  expect(screen.getByText('Queued')).toHaveAttribute('title', expect.stringContaining('Waiting in queue'));
  act(() => jest.advanceTimersByTime(1000));
  expect(screen.getByText('Queued')).toHaveTextContent('Queued: 0h 2m 1s');
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
  expect(screen.getByText('Running')).toHaveTextContent('Running: 0h 2m 0s');
  expect(screen.getByText('Running')).toHaveAttribute('title', expect.stringContaining('Processing elapsed: 0h 1m 0s'));
  expect(screen.queryByText('Evaluating report data')).not.toBeInTheDocument();
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
  expect(screen.getByText('Running')).toHaveAttribute('title', expect.stringContaining('Writing output'));
  expect(screen.getByText('Running')).toHaveTextContent('Running: 0h 1m 0s');
  expect(screen.queryByText(/%/)).not.toBeInTheDocument();
});

it('does not invent a duration when timestamps are missing', () => {
  expect(elapsedTime(undefined, Date.now())).toBeNull();
  expect(elapsedTime('invalid', Date.now())).toBeNull();
  const { container } = render(<ReportProgress report={{ status: 'COMPLETED' }} />);
  expect(container).toHaveTextContent('Completed');
  expect(container).not.toHaveTextContent(':');
  expect(jest.getTimerCount()).toBe(0);
});

it.each(['COMPLETED', 'SAVED'])('shows a fixed duration for %s using the recorded output time', (status) => {
  render(
    <ReportProgress
      report={{ status, requestDate: '2026-10-14T12:00:00Z', renderCompleteDatetime: '2026-10-14T12:02:23Z' }}
    />,
  );
  const label = status === 'SAVED' ? 'Completed and preserved' : 'Completed';
  expect(screen.getByText(label)).toHaveTextContent(`${label}: 0h 2m 23s`);
  act(() => jest.advanceTimersByTime(10000));
  expect(screen.getByText(label)).toHaveTextContent(`${label}: 0h 2m 23s`);
  expect(jest.getTimerCount()).toBe(0);
});

it('uses the evaluation end as a fallback and omits invalid completed durations', () => {
  const { rerender } = render(
    <ReportProgress report={{ status: 'COMPLETED', requestDate: 1000, evaluateCompleteDatetime: 144000 }} />,
  );
  expect(screen.getByText('Completed')).toHaveTextContent('Completed: 0h 2m 23s');
  rerender(<ReportProgress report={{ status: 'COMPLETED', requestDate: 1000, renderCompleteDatetime: 'invalid' }} />);
  expect(screen.getByText('Completed')).not.toHaveTextContent(':');
  rerender(<ReportProgress report={{ status: 'COMPLETED', requestDate: 2000, renderCompleteDatetime: 1000 }} />);
  expect(screen.getByText('Completed')).not.toHaveTextContent(':');
});
