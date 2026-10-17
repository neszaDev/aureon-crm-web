import { describe, expect, it } from 'vitest';
import { safeNextPath } from './SafeRedirect';

describe('SafeRedirect', () => {
  describe(safeNextPath, () => {
    it.each([
      ['/app', '/app'],
      ['/app/12', '/app/12'],
      ['/app/companies?q=acme', '/app/companies?q=acme'],
      ['/invite/abc', '/invite/abc'],
    ])('accepts the in-app path %s', (value, expected) => {
      expect(safeNextPath(value)).toBe(expected);
    });

    it.each([
      ['/fr/app', '/app'],
      ['/th/invite/abc', '/invite/abc'],
    ])('drops the locale prefix of %s so callers can add theirs', (value, expected) => {
      expect(safeNextPath(value)).toBe(expected);
    });

    it.each([
      '//evil.example',
      '/\\evil',
      'https://evil.example',
      // oxlint-disable-next-line no-script-url -- test input, never executed
      'javascript:x',
      '',
      '/fr//evil.example',
      '/\t/evil.example',
      '/app\n',
    ])('rejects %j, which could leave the site', (value) => {
      expect(safeNextPath(value)).toBeUndefined();
    });

    // Encoded so it is safe in a header (next-intl's redirect sends it in `x-action-redirect`).
    it.each([
      ['/app?q=บริษัท', `/app?q=${encodeURIComponent('บริษัท')}`],
      ['/app/companies/บริษัท', `/app/companies/${encodeURIComponent('บริษัท')}`],
      ['/fr/app?q=a b', '/app?q=a%20b'],
      // A fullwidth solidus is not a separator: it stays one encoded segment under /app.
      ['/app/／evil.example', '/app/%EF%BC%8Fevil.example'],
      ['/app/a\u2028b', '/app/a%E2%80%A8b'],
      ['/app?q=a\u3000b', '/app?q=a%E3%80%80b'],
      // An encoded slash is not a separator either: one segment, same origin, still under /app.
      ['/app/..%2F..%2Fdashboard', '/app/..%2F..%2Fdashboard'],
    ])('accepts %j and returns it percent-encoded', (value, expected) => {
      expect(safeNextPath(value)).toBe(expected);
    });

    it.each([
      '/dashboard/x',
      '/',
      '/apple',
      '/invite',
      '/invite/',
      '/invite//x',
      '/fr',
      '/fr/fr/app',
    ])('rejects %s, which is not an allowed root', (value) => {
      expect(safeNextPath(value)).toBeUndefined();
    });

    it.each([
      '/app/../dashboard',
      '/app/./x',
      '/app/..',
      '/app/%2e%2e/dashboard',
      '/app/.%2E/dashboard',
    ])('rejects %s, which has a dot segment', (value) => {
      expect(safeNextPath(value)).toBeUndefined();
    });

    it('rejects a path over 512 characters', () => {
      expect(safeNextPath(`/app/${'a'.repeat(507)}`)).toBe(`/app/${'a'.repeat(507)}`);
      expect(safeNextPath(`/app/${'a'.repeat(508)}`)).toBeUndefined();
    });

    it.each([undefined, null, 42, ['/app']])('rejects the non-string %j', (value) => {
      expect(safeNextPath(value)).toBeUndefined();
    });
  });
});
