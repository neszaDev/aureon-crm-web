import { describe, expect, it } from 'vitest';
import { freshDrawDelays } from './freshRows';

describe(freshDrawDelays, () => {
  const now = Date.parse('2026-10-01T10:00:00Z');

  it('returns a delay for rows created in the last seconds', () => {
    const delays = freshDrawDelays([{ id: 1, createdAt: '2026-10-01T09:59:55Z' }], now);

    expect(delays.get(1)).toBe(150);
  });

  it('skips older rows and rows without a creation time', () => {
    const delays = freshDrawDelays([{ id: 1, createdAt: '2026-10-01T09:00:00Z' }, { id: 2 }], now);

    expect(delays.size).toBe(0);
  });
});
