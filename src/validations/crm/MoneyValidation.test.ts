import { describe, expect, it } from 'vitest';
import { CurrencyCode, MoneyAmount } from './MoneyValidation';

describe('money amount', () => {
  it('accepts up to 13 digits and 2 decimals, without grouping', () => {
    for (const amount of ['0', '1250', '1250.5', '9999999999999.99']) {
      expect(MoneyAmount.parse(amount)).toBe(amount);
    }
  });

  it('trims the amount', () => {
    expect(MoneyAmount.parse(' 1250.50 ')).toBe('1250.50');
  });

  // Grouping, an exponent, a third decimal, a sign, 14 digits, blanks.
  it.each(['1,250.50', '1e3', '0.001', '-5', '10000000000000', '', ' '])('refuses %j', (amount) => {
    expect(MoneyAmount.safeParse(amount).error?.issues[0]?.message).toBe('money_format');
  });
});

describe('currency code', () => {
  it('is the workspace currency rule', () => {
    expect(CurrencyCode.safeParse('THB').success).toBeTruthy();
    expect(CurrencyCode.safeParse('thb').success).toBeFalsy();
  });
});
