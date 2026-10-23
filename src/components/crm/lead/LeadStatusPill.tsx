'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { changeLeadStatus } from '@/actions/crm/LeadActions';
import { UnqualifyDialog } from '@/components/crm/lead/UnqualifyDialog';
import {
  StatusOption,
  StatusRefusal,
  useKeptFocus,
  useStatusChange,
} from '@/components/crm/StatusChange';
import { StatusPill } from '@/components/crm/StatusPill';
import type { components } from '@/libs/api/schema';
import { LEAD_STATUS_TONES } from '@/libs/crm/StatusColors';
import { LEAD_TARGETS } from '@/validations/crm/LeadValidation';

/**
 * A lead's status in a list row as its pill, which is also the control: its menu moves the lead
 * to any other status a change takes (Unqualified asks for its reason first; converting has its
 * own page). The pill waits for the server and shows its answer: the new status, or the refusal
 * under it with the old one kept. A converted lead, or one the caller may not change, shows the
 * pill alone.
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.lead The lead's id, status and version.
 * @param props.name The lead's name, for the dialog and the toast.
 * @param props.canEdit Whether the caller may change it.
 * @returns The pill, with its dialog.
 */
export const LeadStatusPill = (props: {
  workspaceId: number;
  lead: Pick<components['schemas']['LeadResponse'], 'id' | 'status' | 'version'>;
  name: string;
  canEdit: boolean;
}) => {
  const t = useTranslations('LeadStatusMenu');
  const tStatus = useTranslations('LeadStatus');
  const [unqualifying, setUnqualifying] = useState(false);
  const key = `lead-${props.lead.id}`;
  const [cell, markUsed, release] = useKeptFocus(key);
  const change = useStatusChange(release);
  const label = tStatus(`status_${props.lead.status}`);
  const targets = LEAD_TARGETS.filter((status) => status !== props.lead.status);

  if (!props.canEdit || props.lead.status === 'CONVERTED') {
    return <StatusPill tone={LEAD_STATUS_TONES[props.lead.status]} label={label} />;
  }

  return (
    <div ref={cell} data-pill={key} className="flex min-w-0 flex-col items-start">
      <StatusPill
        tone={LEAD_STATUS_TONES[props.lead.status]}
        label={label}
        pending={change.isPending}
        menu={targets.map((status) => (
          <StatusOption
            key={status}
            tone={LEAD_STATUS_TONES[status]}
            label={tStatus(`status_${status}`)}
            onSelect={() => {
              markUsed();
              if (status === 'UNQUALIFIED') {
                setUnqualifying(true);
                return;
              }
              change.run(
                async () =>
                  await changeLeadStatus(props.workspaceId, props.lead.id, props.lead.version, {
                    status,
                    reason: '',
                  }),
                t('moved', { status: tStatus(`status_${status}`) }),
              );
            }}
          />
        ))}
      />
      <StatusRefusal failure={change.failure} fallback={t('error_generic')} />
      <UnqualifyDialog
        open={unqualifying}
        onOpenChange={setUnqualifying}
        workspaceId={props.workspaceId}
        leadId={props.lead.id}
        version={props.lead.version}
        name={props.name}
        returnFocus={() => cell.current?.querySelector('button')}
        onCancel={release}
      />
    </div>
  );
};
