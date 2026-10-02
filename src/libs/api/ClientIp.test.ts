import { describe, expect, it } from 'vitest';
import { clientIpFrom } from './ClientIp';

describe(clientIpFrom, () => {
  it('returns the only address', () => {
    expect(clientIpFrom('203.0.113.7')).toBe('203.0.113.7');
  });

  it('returns the address the nearest proxy appended, not one the client sent', () => {
    expect(clientIpFrom('10.0.0.1, 198.51.100.4 , 203.0.113.7')).toBe('203.0.113.7');
  });

  it('returns nothing without a usable header', () => {
    expect(clientIpFrom(null)).toBeUndefined();
    expect(clientIpFrom('')).toBeUndefined();
    expect(clientIpFrom(' , ')).toBeUndefined();
  });
});
