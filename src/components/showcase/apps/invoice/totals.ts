import type { InvoiceLine } from './data';

/**
 * The invoice totals, in whole cents: subtotal, the discount on it, VAT on the discounted
 * amount, and the total due.
 * @param options Totals options.
 * @param options.lines Invoice lines.
 * @param options.discountRate Discount as a fraction (0.2 is 20%).
 * @param options.vatRate VAT as a fraction, applied after the discount.
 * @returns The amounts in cents.
 */
export const invoiceTotals = (options: {
  lines: InvoiceLine[];
  discountRate: number;
  vatRate: number;
}) => {
  const subtotal = options.lines.reduce((sum, line) => sum + line.quantity * line.unitCents, 0);
  const discount = Math.round(subtotal * options.discountRate);
  const vat = Math.round((subtotal - discount) * options.vatRate);
  return { subtotal, discount, vat, total: subtotal - discount + vat };
};
