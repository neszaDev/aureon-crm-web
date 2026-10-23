'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { moveDeal } from '@/actions/crm/DealActions';
import { LostReasonDialog } from '@/components/crm/deal/LostReasonDialog';
import {
  StatusOption,
  StatusRefusal,
  useKeptFocus,
  useStatusChange,
} from '@/components/crm/StatusChange';
import { StatusPill } from '@/components/crm/StatusPill';
import type { StageRef } from '@/libs/crm/Stages';
import { stageTone } from '@/libs/crm/StatusColors';

/**
 * A deal's stage in a list row as its pill, which is also the control: its menu moves the deal to
 * any other stage of the pipeline, in order. Lost asks for its reason first (cancelling moves
 * nothing); Won closes it at once, as a drop on the board does. The pill waits for the server and
 * shows its answer: the new stage, or the refusal under it with the old one kept. A deal the
 * caller may not move shows the pill alone.
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.deal The deal's id, name, version and stage.
 * @param props.stages The pipeline's stages, in order.
 * @param props.canEdit Whether the caller may move it.
 * @returns The pill, with its dialog.
 */
export const DealStagePill = (props: {
  workspaceId: number;
  deal: { id: number; name: string; version: number; stage: StageRef };
  stages: StageRef[];
  canEdit: boolean;
}) => {
  const t = useTranslations('MoveDealDialog');
  const tTable = useTranslations('DealTable');
  const tBoard = useTranslations('DealBoard');
  const [losing, setLosing] = useState<StageRef>();
  const key = `deal-${props.deal.id}`;
  const [cell, markUsed, release] = useKeptFocus(key);
  const change = useStatusChange(release);
  const move = (stage: StageRef, lostReason?: string) => {
    change.run(
      async () =>
        await moveDeal(props.workspaceId, props.deal.id, {
          stageId: stage.id,
          version: props.deal.version,
          lostReason,
        }),
      t('done', { name: props.deal.name, stage: stage.name }),
    );
  };
  const pill = {
    tone: stageTone(props.stages, props.deal.stage.id),
    label: props.deal.stage.name,
    field: tTable('stage'),
  };

  if (!props.canEdit) {
    return <StatusPill {...pill} />;
  }

  return (
    <div ref={cell} data-pill={key} className="flex min-w-0 flex-col items-start">
      <StatusPill
        {...pill}
        pending={change.isPending}
        menu={props.stages
          .filter((stage) => stage.id !== props.deal.stage.id)
          .map((stage) => (
            <StatusOption
              key={stage.id}
              tone={stageTone(props.stages, stage.id)}
              label={stage.name}
              onSelect={() => {
                markUsed();
                if (stage.kind === 'LOST') {
                  // Not moved yet: the reason comes first.
                  setLosing(stage);
                } else {
                  move(stage);
                }
              }}
            />
          ))}
      />
      <StatusRefusal failure={change.failure} fallback={tBoard('error_generic')} />
      <LostReasonDialog
        open={losing !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setLosing(undefined);
          }
        }}
        dealName={props.deal.name}
        returnFocus={() => cell.current?.querySelector('button')}
        onCancel={release}
        onConfirm={(reason) => {
          if (losing) {
            move(losing, reason);
          }
        }}
      />
    </div>
  );
};
