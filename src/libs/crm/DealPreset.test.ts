import { describe, expect, it } from 'vitest';
import { dealPreset } from './DealPreset';

const STAGES = [
  { id: 11, name: 'Qualification', kind: 'OPEN' as const },
  { id: 12, name: 'Proposal', kind: 'OPEN' as const },
  { id: 13, name: 'Won', kind: 'WON' as const },
  { id: 14, name: 'Lost', kind: 'LOST' as const },
];
const MEMBERS = [{ userId: 1 }, { userId: 2 }];
const preset = (opts: Partial<Parameters<typeof dealPreset>[0]>) =>
  dealPreset({ stages: STAGES, members: MEMBERS, mayAssign: true, me: 1, ...opts });

describe(dealPreset, () => {
  it('starts in the open stage and with the member the link names', () => {
    expect(preset({ stageId: 12, ownerId: 2 })).toStrictEqual({ stageId: 12, ownerId: 2 });
  });

  it('gives the deal to the caller when their role may not give it to someone else', () => {
    expect(preset({ ownerId: 2, mayAssign: false })).toStrictEqual({ stageId: 11, ownerId: 1 });
  });

  it('gives the deal to the caller for an id that is not a member', () => {
    expect(preset({ ownerId: 99 })).toStrictEqual({ stageId: 11, ownerId: 1 });
  });

  it('starts in the first open stage for Won, Lost or a stage the pipeline lacks', () => {
    expect([13, 14, 99].map((stageId) => preset({ stageId }).stageId)).toStrictEqual([11, 11, 11]);
  });

  it('names no stage for a pipeline without an open one', () => {
    expect(preset({ stages: STAGES.slice(2) }).stageId).toBeNull();
  });
});
