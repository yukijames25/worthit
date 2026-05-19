import { describe, expect, it } from 'vitest';
import { initialNextDue, nextDueAfter } from './useRecurring';

describe('nextDueAfter', () => {
  it('rolls to next month, same day-of-month', () => {
    const from = new Date(2026, 4, 15).getTime(); // May 15
    const next = new Date(nextDueAfter(from, 15));
    expect(next.getMonth()).toBe(5); // June
    expect(next.getDate()).toBe(15);
  });

  it('clamps day 31 to month end (e.g., Feb)', () => {
    const from = new Date(2026, 0, 31).getTime(); // Jan 31
    const next = new Date(nextDueAfter(from, 31));
    expect(next.getMonth()).toBe(1); // Feb
    expect(next.getDate()).toBe(28); // 2026 is not leap
  });

  it('preserves day 31 for months that have it', () => {
    const from = new Date(2026, 2, 31).getTime(); // Mar 31
    const next = new Date(nextDueAfter(from, 31));
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(30); // April has 30
    const further = new Date(nextDueAfter(next.getTime(), 31));
    expect(further.getMonth()).toBe(4); // May
    expect(further.getDate()).toBe(31);
  });
});

describe('initialNextDue', () => {
  it('returns this month if day >= today', () => {
    const now = new Date(2026, 4, 10).getTime();
    const due = new Date(initialNextDue(15, now));
    expect(due.getFullYear()).toBe(2026);
    expect(due.getMonth()).toBe(4);
    expect(due.getDate()).toBe(15);
  });

  it('returns next month if day < today', () => {
    const now = new Date(2026, 4, 20).getTime();
    const due = new Date(initialNextDue(15, now));
    expect(due.getMonth()).toBe(5);
    expect(due.getDate()).toBe(15);
  });

  it('clamps to month-end on overshoot', () => {
    const now = new Date(2026, 1, 1).getTime(); // Feb 1
    const due = new Date(initialNextDue(31, now));
    // dayOfMonth 31 >= today 1 -> use this month (Feb), clamp to 28
    expect(due.getMonth()).toBe(1);
    expect(due.getDate()).toBe(28);
  });
});
