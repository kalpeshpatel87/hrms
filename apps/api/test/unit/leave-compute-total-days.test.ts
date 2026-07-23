import { LeaveUnit } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { computeTotalDays } from '../../src/modules/leave/leave.service.js';

describe('computeTotalDays', () => {
  it('counts a single full day as 1', () => {
    const day = new Date('2026-03-10');
    expect(computeTotalDays(day, day, LeaveUnit.FULL_DAY, LeaveUnit.FULL_DAY)).toBe(1);
  });

  it('counts a single half day as 0.5', () => {
    const day = new Date('2026-03-10');
    expect(computeTotalDays(day, day, LeaveUnit.HALF_DAY_FIRST, LeaveUnit.FULL_DAY)).toBe(0.5);
    expect(computeTotalDays(day, day, LeaveUnit.FULL_DAY, LeaveUnit.HALF_DAY_SECOND)).toBe(0.5);
  });

  it('counts a full multi-day range inclusively', () => {
    const start = new Date('2026-03-10');
    const end = new Date('2026-03-14');
    expect(computeTotalDays(start, end, LeaveUnit.FULL_DAY, LeaveUnit.FULL_DAY)).toBe(5);
  });

  it('shaves 0.5 off each boundary that is a half day', () => {
    const start = new Date('2026-03-10');
    const end = new Date('2026-03-14');
    expect(computeTotalDays(start, end, LeaveUnit.HALF_DAY_SECOND, LeaveUnit.FULL_DAY)).toBe(4.5);
    expect(computeTotalDays(start, end, LeaveUnit.FULL_DAY, LeaveUnit.HALF_DAY_FIRST)).toBe(4.5);
    expect(computeTotalDays(start, end, LeaveUnit.HALF_DAY_SECOND, LeaveUnit.HALF_DAY_FIRST)).toBe(4);
  });

  it('throws when endDate is before startDate', () => {
    const start = new Date('2026-03-14');
    const end = new Date('2026-03-10');
    expect(() => computeTotalDays(start, end, LeaveUnit.FULL_DAY, LeaveUnit.FULL_DAY)).toThrow();
  });
});
