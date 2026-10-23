import type { components } from '@/libs/api/schema';

type Change = components['schemas']['StageChangeResponse'];
type Member = components['schemas']['MemberRef'];

/**
 * Who moved a deal into a stage, and when: without `by` that member has since left the
 * workspace; without `at` the source doesn't say (the board's summaries name only the member).
 */
export type StageSigner = { by?: Member; at?: string };

/**
 * Who moved a deal into each stage of its status track, and when: for each stage, the newest move
 * into it. A stage the history names without an id was deleted since, so it has none (its segment
 * isn't on the pipeline any more).
 * @param history The deal's stage history, newest first, as the API lists it.
 * @returns The mover by stage id; a stage without a recorded move has no key.
 */
export const stageSignatures = (history: Change[]) => {
  const signatures: Record<number, StageSigner> = {};
  for (const change of history) {
    const stageId = change.toStage.id;
    // The newest entry decides, even when its member has left: an older mover isn't who put
    // the deal there last.
    if (stageId !== undefined && !(stageId in signatures)) {
      signatures[stageId] = { by: change.changedBy, at: change.changedAt };
    }
  }

  return signatures;
};

/**
 * Who moved a deal into each stage, from the board's deal summaries: the API sends one signature
 * for each stage the deal has a move into (the newest decides), without a member when that one has
 * left, and without its time. Their order doesn't matter.
 * @param signatures The summary's `signatures`.
 * @returns The mover by stage id; a stage without a recorded move has no key.
 */
export const signaturesOf = (signatures: components['schemas']['StageSignature'][]) =>
  Object.fromEntries(
    signatures.map((signature): [number, StageSigner] => [signature.stageId, { by: signature.by }]),
  );
