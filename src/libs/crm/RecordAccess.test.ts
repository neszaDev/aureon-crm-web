import { describe, expect, it } from 'vitest';
import type { Permission } from './Permissions';
import { canAssign, canEditRecord } from './RecordAccess';

const ME = 7;
const rep = { permissions: [] satisfies Permission[] };
const manager = {
  permissions: ['RECORDS_EDIT_ANY', 'RECORDS_ASSIGN', 'EXPORT'] satisfies Permission[],
};

describe(canEditRecord, () => {
  it('lets a sales rep edit their own record only', () => {
    expect(canEditRecord(rep, ME, ME)).toBeTruthy();
    expect(canEditRecord(rep, ME, 8)).toBeFalsy();
  });

  it("doesn't let a sales rep edit an unassigned record", () => {
    expect(canEditRecord(rep, ME)).toBeFalsy();
  });

  it('lets a manager edit anyone’s record, unassigned ones too', () => {
    expect(canEditRecord(manager, ME, 8)).toBeTruthy();
    expect(canEditRecord(manager, ME)).toBeTruthy();
  });
});

describe('canEditRecord on a task', () => {
  it("lets a sales rep edit a task they're assigned or created, and no other", () => {
    // Assigned to someone else, created by them; assigned to them; neither.
    expect(canEditRecord(rep, ME, 8, ME)).toBeTruthy();
    expect(canEditRecord(rep, ME, ME)).toBeTruthy();
    expect(canEditRecord(rep, ME, 8, 9)).toBeFalsy();
    // Unassigned, its creator gone: a manager's.
    expect(canEditRecord(rep, ME)).toBeFalsy();
    expect(canEditRecord(manager, ME)).toBeTruthy();
  });
});

describe(canAssign, () => {
  it('needs RECORDS_ASSIGN', () => {
    expect(canAssign(rep)).toBeFalsy();
    expect(canAssign(manager)).toBeTruthy();
  });
});
