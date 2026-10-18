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
