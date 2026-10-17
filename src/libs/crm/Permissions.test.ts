import { describe, expect, it } from 'vitest';
import { can } from './Permissions';

describe(can, () => {
  it('allows a permission in the workspace list', () => {
    expect(can({ permissions: ['MEMBERS_MANAGE', 'EXPORT'] }, 'MEMBERS_MANAGE')).toBeTruthy();
  });

  it('denies a permission missing from the list', () => {
    expect(can({ permissions: ['EXPORT'] }, 'WORKSPACE_MANAGE')).toBeFalsy();
    expect(can({ permissions: [] }, 'EXPORT')).toBeFalsy();
  });

  it('denies everything when the workspace has no permission list', () => {
    expect(can({}, 'RECORDS_EDIT_ANY')).toBeFalsy();
  });
});
