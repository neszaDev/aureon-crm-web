import { describe, expect, it } from 'vitest';
import { MemberRoleValidation } from './MemberValidation';

describe('member validation', () => {
  it('accepts every workspace role', () => {
    for (const role of ['OWNER', 'ADMIN', 'MANAGER', 'SALES_REP']) {
      expect(MemberRoleValidation.safeParse({ role }).success).toBeTruthy();
    }
  });

  it('rejects an unknown or missing role', () => {
    expect(MemberRoleValidation.safeParse({ role: 'USER' }).error?.issues[0]?.message).toBe(
      'required',
    );
    expect(MemberRoleValidation.safeParse({}).success).toBeFalsy();
  });
});
