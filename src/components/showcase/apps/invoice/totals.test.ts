import { describe, expect, it } from 'vitest';
import { INVOICE } from './data';
import { invoiceTotals } from './totals';

describe(invoiceTotals, () => {
  it('matches the figures of the Vue sample invoice', () => {
    expect(invoiceTotals(INVOICE)).toStrictEqual({
      subtotal: 849_700,
      discount: 169_940,
      vat: 67_976,
      total: 747_736,
    });
  });

  it('rounds the discount and VAT to whole cents', () => {
    const totals = invoiceTotals({
      lines: [{ item: 'Pen', description: '', quantity: 3, unitCents: 333 }],
      discountRate: 0.15,
      vatRate: 0.2,
    });

    expect(totals).toStrictEqual({ subtotal: 999, discount: 150, vat: 170, total: 1019 });
  });

  it('returns zeros for an empty invoice', () => {
    expect(invoiceTotals({ lines: [], discountRate: 0.2, vatRate: 0.1 }).total).toBe(0);
  });
});
