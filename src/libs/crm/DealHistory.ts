import type { components } from '@/libs/api/schema';

type Change = components['schemas']['StageChangeResponse'];
type Member = components['schemas']['MemberRef'];

/**
 * Who signs each stage of a deal's stamp row: for each stage, the member who made the newest
 * move into it. A stage the history names without an id was deleted since, so it signs nothing
 * (its row isn't on the pipeline any more); neither does a move whose member has left.
 * @param history The deal's stage history, newest first, as the API lists it.
 * @returns The signer by stage id; a stage without one has no key.
 */
export const stageSignatures = (history: Change[]) => {
  const signatures: Record<number, Member | undefined> = {};
  const seen = new Set<number>();
  for (const change of history) {
    const stageId = change.toStage.id;
    // The newest entry decides, even when its member has left: an older signer isn't who put
    // the deal there last.
    if (stageId === undefined || seen.has(stageId)) {
      continue;
    }
    seen.add(stageId);
    if (change.changedBy) {
      signatures[stageId] = change.changedBy;
    }
  }

  return signatures;
};

/**
 * Who signs each stage of a deal's stamp row, from the board's deal summaries: the API sends one
 * signature for each stage the deal has a move into (the newest decides), without a member when
 * that one has left. Their order doesn't matter.
 * @param signatures The summary's `signatures`.
 * @returns The signer by stage id; a stage without one has no key.
 */
export const signaturesOf = (signatures: components['schemas']['StageSignature'][]) => {
  const signers: Record<number, Member | undefined> = {};
  for (const signature of signatures) {
    if (signature.by) {
      signers[signature.stageId] = signature.by;
    }
  }

  return signers;
};
