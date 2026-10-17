import { describe, expect, it } from 'vitest';
import { toWorkspaceId } from './WorkspaceId';

describe(toWorkspaceId, () => {
  it('reads a positive id of up to 15 digits', () => {
    expect(toWorkspaceId('1')).toBe(1);
    expect(toWorkspaceId('42')).toBe(42);
    expect(toWorkspaceId('999999999999999')).toBe(999_999_999_999_999);
  });

  it('rejects zero and leading zeros, so each workspace has one URL', () => {
    expect(toWorkspaceId('0')).toBeUndefined();
    expect(toWorkspaceId('007')).toBeUndefined();
  });

  it('rejects anything that is not a plain number', () => {
    for (const segment of ['', 'abc', '-1', '1.5', '1e3', ' 1', '1234567890123456']) {
      expect(toWorkspaceId(segment)).toBeUndefined();
    }
  });
});
