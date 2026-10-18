import { describe, expect, it } from 'vitest';
import type { components } from '@/libs/api/schema';
import { stageSignatures } from './DealHistory';

type Change = components['schemas']['StageChangeResponse'];

const MIA = { userId: 1, email: 'mia@acme.test', displayName: 'Mia Manager' };
const RILEY = { userId: 2, email: 'riley@acme.test', displayName: 'Riley Rep' };

const MOVED: Change = {
  fromStage: { id: 1, name: 'Qualification' },
  toStage: { id: 2, name: 'Proposal' },
  changedBy: RILEY,
  changedAt: '2026-10-12T09:00:00Z',
};
const CREATED: Change = {
  toStage: { id: 1, name: 'Qualification' },
  changedBy: MIA,
  changedAt: '2026-10-10T09:00:00Z',
};
// Newest first, as the API lists them.
const HISTORY: Change[] = [MOVED, CREATED];

describe(stageSignatures, () => {
  it('signs each stage with whoever moved the deal into it', () => {
    expect(stageSignatures(HISTORY)).toStrictEqual({ 1: MIA, 2: RILEY });
  });

  it('keeps the newest entry when a deal entered a stage twice', () => {
    const back: Change[] = [
      {
        fromStage: { id: 2, name: 'Proposal' },
        toStage: { id: 1, name: 'Qualification' },
        changedBy: RILEY,
        changedAt: '2026-10-14T09:00:00Z',
      },
      ...HISTORY,
    ];

    expect(stageSignatures(back)).toStrictEqual({ 1: RILEY, 2: RILEY });
  });

  it('signs nothing for a stage that was deleted, but lists the others', () => {
    const deleted: Change[] = [
      {
        fromStage: { name: 'Demo' },
        toStage: { id: 2, name: 'Proposal' },
        changedBy: RILEY,
        changedAt: '2026-10-12T09:00:00Z',
      },
      {
        fromStage: { id: 1, name: 'Qualification' },
        toStage: { name: 'Demo' },
        changedBy: MIA,
        changedAt: '2026-10-11T09:00:00Z',
      },
      CREATED,
    ];

    expect(stageSignatures(deleted)).toStrictEqual({ 1: MIA, 2: RILEY });
    expect(Object.keys(stageSignatures(deleted))).toHaveLength(2);
  });

  it('leaves a stage unsigned once the member who moved the deal there has left', () => {
    const left: Change[] = [{ ...MOVED, changedBy: undefined }, CREATED];

    expect(stageSignatures(left)).toStrictEqual({ 1: MIA });
  });
});
