'use client';

import { ChevronDownIcon, LoaderCircleIcon, RepeatIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { changeLeadStatus } from '@/actions/crm/LeadActions';
import { UnqualifyDialog } from '@/components/crm/lead/UnqualifyDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { components } from '@/libs/api/schema';
import { toastActionFailure } from '@/utils/ActionToast';
import { LEAD_TARGETS } from '@/validations/crm/LeadValidation';

/**
 * A lead page's status menu: the other statuses a lead may move to (any of New, Contacted,
 * Qualified and Unqualified; converting has its own button). Unqualified asks for a reason first.
 * Each move says so in a toast; a refusal too, with a reload when someone changed the lead first.
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.lead The lead's id, status, version and name.
 * @param props.lead.id The lead.
 * @param props.lead.status Its current status, which the menu leaves out.
 * @param props.lead.version The version the page was read at.
 * @param props.name The lead's name.
 * @returns The menu button, with its dialog.
 */
export const LeadStatusMenu = (props: {
  workspaceId: number;
  lead: Pick<components['schemas']['LeadResponse'], 'id' | 'status' | 'version'>;
  name: string;
}) => {
  const t = useTranslations('LeadStatusMenu');
  const tStatus = useTranslations('LeadStatus');
  const tError = useTranslations('ActionError');
  const [isPending, startTransition] = useTransition();
  const [unqualifying, setUnqualifying] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  const move = (status: (typeof LEAD_TARGETS)[number]) => {
    startTransition(async () => {
      const result = await changeLeadStatus(props.workspaceId, props.lead.id, props.lead.version, {
        status,
        reason: '',
      });
      if (result.ok) {
        toast.success(t('moved', { status: tStatus(`status_${status}`) }));
      } else {
        toastActionFailure(result, t('error_generic'), tError('reload'));
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={button} variant="outline" aria-disabled={isPending || undefined}>
            {isPending ? (
              <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <RepeatIcon data-icon="inline-start" />
            )}
            {t('trigger')}
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-44">
          <DropdownMenuLabel>{t('label')}</DropdownMenuLabel>
          {LEAD_TARGETS.filter((status) => status !== props.lead.status).map((status) => (
            <DropdownMenuItem
              key={status}
              disabled={isPending}
              onSelect={() => {
                if (status === 'UNQUALIFIED') {
                  setUnqualifying(true);
                } else {
                  move(status);
                }
              }}
            >
              {tStatus(`status_${status}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <UnqualifyDialog
        open={unqualifying}
        onOpenChange={setUnqualifying}
        workspaceId={props.workspaceId}
        leadId={props.lead.id}
        version={props.lead.version}
        name={props.name}
        returnFocus={() => button.current}
      />
    </>
  );
};
