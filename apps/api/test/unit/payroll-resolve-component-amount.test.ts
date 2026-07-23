import { ComponentCalculationType, Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { resolveComponentAmount } from '../../src/modules/payroll/payroll.service.js';

describe('resolveComponentAmount', () => {
  it('returns the flat amount for FIXED components', () => {
    const result = resolveComponentAmount(
      ComponentCalculationType.FIXED,
      new Prisma.Decimal(1500),
      null,
      50000,
      30000,
    );
    expect(result).toBe(1500);
  });

  it('computes a percentage of the basic component for PERCENTAGE_OF_BASIC', () => {
    const result = resolveComponentAmount(
      ComponentCalculationType.PERCENTAGE_OF_BASIC,
      new Prisma.Decimal(0),
      new Prisma.Decimal(40),
      50000,
      30000,
    );
    expect(result).toBe(12000); // 40% of 30000 basic
  });

  it('computes a percentage of monthly CTC for PERCENTAGE_OF_CTC', () => {
    const result = resolveComponentAmount(
      ComponentCalculationType.PERCENTAGE_OF_CTC,
      new Prisma.Decimal(0),
      new Prisma.Decimal(12),
      50000,
      30000,
    );
    expect(result).toBe(6000); // 12% of 50000 CTC
  });

  it('falls back to the flat amount for FORMULA components (no parser implemented)', () => {
    const result = resolveComponentAmount(
      ComponentCalculationType.FORMULA,
      new Prisma.Decimal(2500),
      new Prisma.Decimal(10),
      50000,
      30000,
    );
    expect(result).toBe(2500);
  });
});
