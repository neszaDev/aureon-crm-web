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

    it.each(['/dashboard/x', '/', '/apple', '/invite', '/fr', '/fr/fr/app'])(
      'rejects %s, which is not an allowed root',
      (value) => {
        expect(safeNextPath(value)).toBeUndefined();
      },
    );

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
