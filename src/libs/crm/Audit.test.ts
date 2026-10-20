import { describe, expect, it } from 'vitest';
import { AUDIT_LIST } from './Audit';
import { parseListQuery } from './ListQuery';

describe('the audit trail list', () => {
  it('reads the record type and the actor, and drops what the backend would refuse', () => {
    const query = parseListQuery(AUDIT_LIST, {
      entityType: 'PIPELINE_STAGE',
      actorId: '4',
      entityId: '9',
      size: '50',
    });

    expect(query).toMatchObject({
      size: 50,
      filters: { entityType: 'PIPELINE_STAGE', actorId: 4 },
    });
    expect(query.params).toStrictEqual({
      entityType: 'PIPELINE_STAGE',
      actorId: '4',
      size: '50',
    });
    expect(
      parseListQuery(AUDIT_LIST, { entityType: 'INVOICE', actorId: 'me' }).filters,
    ).toStrictEqual({});
  });
});
