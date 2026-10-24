'use client';

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleDotIcon,
  LoaderCircleIcon,
  UserRoundIcon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Toolbar } from 'radix-ui';
import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { archiveCompany, assignCompany, restoreCompany } from '@/actions/crm/CompanyActions';
import { archiveContact, assignContact, restoreContact } from '@/actions/crm/ContactActions';
import { archiveDeal, assignDeal, moveDeal, restoreDeal } from '@/actions/crm/DealActions';
import { archiveLead, assignLead, changeLeadStatus, restoreLead } from '@/actions/crm/LeadActions';
import { assignTask, cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { LostReasonDialog } from '@/components/crm/deal/LostReasonDialog';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import { StatusOption } from '@/components/crm/StatusChange';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import type { BulkEntity, BulkItem } from '@/libs/crm/BulkSelection';
import { BULK_BAR_SLOT, bulkActions, runPooled } from '@/libs/crm/BulkSelection';
import type { StageRef } from '@/libs/crm/Stages';
import { LEAD_STATUS_TONES, stageTone, TASK_STATUS_TONES } from '@/libs/crm/StatusColors';
import { useRouter } from '@/libs/I18nNavigation';
import { useSettle } from '@/utils/SettleAction';
import { LEAD_TARGETS } from '@/validations/crm/LeadValidation';

type Member = components['schemas']['MemberResponse'];
type Act = (item: BulkItem) => Promise<ActionResult>;
type Refusal = { id: number; name: string; reason: string };

// What a dialog's action answers: it closes at once, and the bar runs the records.
const CLOSE: ActionResult = { ok: true };

// How many records are on their way at once.
const AT_ONCE = 4;

// The version a status move sends: leads, deals and tasks are always listed with theirs.
const versionOf = (item: BulkItem) => item.version ?? 0;

// The status menu's button, which its dialogs give the focus back.
const statusMenu = () => document.querySelector<HTMLElement>('[data-bar-menu="status"]');

// A control on the ink-violet bar, as on the rail: white at 80%, full white on hover or open, the
// on-rail focus ring (the page's violet one would sit on the bar under 3:1).
const ON_BAR =
  'px-2.5 text-[0.8125rem] text-on-rail/80 hover:bg-white/10 hover:text-on-rail focus-visible:ring-on-rail focus-visible:ring-offset-rail aria-expanded:bg-white/10 aria-expanded:text-on-rail dark:focus-visible:ring-offset-rail-raised';

/**
 * An action's name over its icon where a phone's bar draws the icon alone, on a device with hover
 * (a touch screen opens no tooltip). Needs the bar's `TooltipProvider`.
 * @param props Component props.
 * @param props.label The action's name.
 * @param props.children The action's button.
 * @returns The button with its tooltip.
 */
const PhoneTip = (props: { label: string; children: React.ReactElement }) => (
  <Tooltip>
    <TooltipTrigger asChild>{props.children}</TooltipTrigger>
    <TooltipContent side="top" sideOffset={6} className="sm:hidden">
      {props.label}
    </TooltipContent>
  </Tooltip>
);

/**
 * The records' own actions: assign each, and archive or restore it (tasks are never archived).
 * @param entity The records' kind.
 * @returns The actions.
 */
const actionsOf = (
  entity: BulkEntity,
): {
  assign: (
    workspaceId: number,
    id: number,
    version: number | undefined,
    ownerId: number,
    options: { refreshPage: boolean },
  ) => Promise<ActionResult>;
  archive?: (
    workspaceId: number,
    id: number,
    options: { refreshPage: boolean },
  ) => Promise<ActionResult>;
  restore?: (
    workspaceId: number,
    id: number,
    options: { refreshPage: boolean },
  ) => Promise<ActionResult>;
} => {
  const actions = {
    company: { assign: assignCompany, archive: archiveCompany, restore: restoreCompany },
    contact: { assign: assignContact, archive: archiveContact, restore: restoreContact },
    lead: { assign: assignLead, archive: archiveLead, restore: restoreLead },
    deal: { assign: assignDeal, archive: archiveDeal, restore: restoreDeal },
    task: { assign: assignTask },
  };

  return actions[entity];
};

/** What a list gives its bulk bar. */
export type BulkBarProps = {
  entity: BulkEntity;
  workspaceId: number;
  members: Member[];
  /** Whether the caller may give records to others (`RECORDS_ASSIGN`). */
  mayAssign: boolean;
  /** Whether the list is the archive. */
  archived: boolean;
  /** The pipeline's stages, in order (deals). */
  stages?: StageRef[];
  /** The list's heading, which takes the focus when the bar goes with it. */
  headingId: string;
  chosen: BulkItem[];
  onClear: () => void;
  /** Keeps these selected (the refused ones), and only these. */
  onKeep: (ids: number[]) => void;
};

/**
 * A menu on the bar: its button, and its items above it under a label.
 * @param props Component props.
 * @param props.icon The button's icon.
 * @param props.label The button's label.
 * @param props.menuLabel What the menu's items do, such as "Move to".
 * @param props.busy Whether records are on their way (it stays, but doesn't open).
 * @param props.name What finds the button again (`data-bar-menu`), for a dialog opened from the
 *   menu to give it the focus back.
 * @param props.children The items.
 * @returns The menu.
 */
const BarMenu = (props: {
  icon: React.ReactNode;
  label: string;
  menuLabel: string;
  busy: boolean;
  name: string;
  children: React.ReactNode;
}) => {
  // Held here: it opens only while not busy. (An `open` forced shut while busy would drop the
  // close that follows an item's select, which starts the run, and reopen the menu after it.)
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next && !props.busy);
      }}
    >
      <PhoneTip label={props.label}>
        <DropdownMenuTrigger asChild>
          <Toolbar.Button asChild>
            <Button
              data-bar-menu={props.name}
              variant="ghost"
              aria-label={props.label}
              aria-disabled={props.busy || undefined}
              className={ON_BAR}
            >
              {props.icon}
              <span className="max-sm:hidden">{props.label}</span>
              <ChevronDownIcon data-icon="inline-end" className="opacity-70" />
            </Button>
          </Toolbar.Button>
        </DropdownMenuTrigger>
      </PhoneTip>
      <DropdownMenuContent side="top" align="start" className="max-h-72 overflow-y-auto">
        <DropdownMenuLabel>{props.menuLabel}</DropdownMenuLabel>
        {props.children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * What the bar says first: how many records are selected, or how far a run has got; then why
 * actions are missing, when a record isn't the caller's to change or a lead was converted.
 * @param props Component props.
 * @param props.count How many are selected.
 * @param props.pending Whether records are on their way.
 * @param props.progress How many of them have had their answer, of how many.
 * @param props.locked How many the caller may not change.
 * @param props.converted How many are converted leads.
 * @returns The count and the note.
 */
const BarCount = (props: {
  count: number;
  pending: boolean;
  progress: { done: number; total: number };
  locked: number;
  converted: number;
}) => {
  const t = useTranslations('BulkBar');

  return (
    <>
      <output className="flex items-center gap-2 px-2 text-[0.8125rem] font-semibold whitespace-nowrap tabular-nums">
        {props.pending && <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />}
        {props.pending ? t('progress', props.progress) : t('selected', { count: props.count })}
      </output>
      {(props.locked > 0 || props.converted > 0) && (
        <span className="min-w-0 px-2 text-[0.8125rem] text-on-rail/80">
          {props.locked > 0
            ? t('locked', { count: props.locked })
            : t('converted', { count: props.converted })}
        </span>
      )}
    </>
  );
};

/**
 * The records a bulk action left unchanged: each by name with the reason the server gave, in an
 * alert above the bar until dismissed.
 * @param props Component props.
 * @param props.refused The records refused.
 * @param props.total How many the action was for.
 * @param props.onDismiss Closes it.
 * @returns The alert.
 */
const RefusedAlert = (props: { refused: Refusal[]; total: number; onDismiss: () => void }) => {
  const t = useTranslations('BulkBar');

  return (
    <div
      role="alert"
      className="w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-rule bg-popover text-popover-foreground shadow-float"
    >
      <div className="flex items-start gap-2 py-2 pr-2 pl-3">
        <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
        <p className="flex-1 text-sm font-semibold">
          {t('refused', { failed: props.refused.length, total: props.total })}
        </p>
        <Button variant="ghost" size="icon-xs" aria-label={t('dismiss')} onClick={props.onDismiss}>
          <XIcon />
        </Button>
      </div>
      <ul className="max-h-48 overflow-y-auto border-t border-rule px-3 py-1.5">
        {props.refused.map((item) => (
          <li key={item.id} className="py-1 text-[0.8125rem]">
            <span className="block font-medium break-words">{item.name}</span>
            <span className="block text-muted-foreground">{item.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * The bulk action bar: an ink-violet toolbar floating at the bottom centre of the list while rows
 * are selected, named "N selected". It offers only what the caller may do to every selected
 * record (`bulkActions`): assign (tasks: the assignee), the status (leads: Unqualified asks one
 * reason for all; deals: the stage, Lost asks one reason; tasks: complete, reopen, or cancel once
 * confirmed), archive (confirmed) or, in the archive, restore; and clear. A record that isn't the
 * caller's to change leaves only Clear, and says so. Each record goes through its own server
 * action, four at a time, with the count in the bar; nothing changes on screen before the server
 * says so, and the list refreshes once, after the last answer. Then one answer: a toast when all
 * of them changed (the selection clears), or an alert naming each refused record with its reason
 * (they stay selected), until it is dismissed, × clears the selection or the list's state changes.
 * @param props Component props.
 * @returns The bar, or nothing while nothing is selected.
 */
export const BulkBar = (props: BulkBarProps) => {
  const t = useTranslations('BulkBar');
  const tStatus = useTranslations('LeadStatus');
  const tRecord = useTranslations('RecordActions');
  const tLost = useTranslations('LostReasonDialog');
  const tUnqualify = useTranslations('UnqualifyDialog');
  const tApi = useTranslations('ApiError');
  const settle = useSettle();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [refused, setRefused] = useState<Refusal[]>([]);
  const [asking, setAsking] = useState<'archive' | 'cancel' | 'reason'>();
  const [losing, setLosing] = useState<StageRef>();
  const count = props.chosen.length;
  // The last action's refusals stay until dismissed, cleared with × or the list's state changes
  // (the list remounts the bar), even once their records have left the list.
  if (count === 0 && !isPending && refused.length === 0) {
    return null;
  }

  const allowed = bulkActions(props.entity, props.chosen, props);
  const { assign: assignOne, archive, restore } = actionsOf(props.entity);
  const records = (many: number) => t('records', { entity: props.entity, count: many });
  // Why a record was refused, in words that fit a list: there are no fields to highlight, and the
  // list shows a record changed meanwhile as it is now (it refreshes after the run).
  const reasonOf = (result?: ActionResult) => {
    if (result?.conflict) {
      return t('changed_meanwhile');
    }
    return result?.fieldErrors ? tApi('status_400') : (result?.message ?? tApi('generic'));
  };
  const run = (act: Act, done: (many: number) => string) => {
    if (isPending) {
      return;
    }
    const targets = props.chosen;
    setRefused([]);
    setProgress({ done: 0, total: targets.length });
    startTransition(async () => {
      const results = await runPooled(
        targets,
        AT_ONCE,
        async (item) => await settle(act(item)),
        () => {
          setProgress((now) => ({ ...now, done: now.done + 1 }));
        },
      );
      // One refresh for the whole run, the refused records' current state included (a newer
      // version, another owner): each record's action leaves it out (`{ refreshPage: false }`).
      router.refresh();
      const failed = targets.flatMap((item, index) => {
        const result = results[index];
        return result?.ok ? [] : [{ id: item.id, name: item.name, reason: reasonOf(result) }];
      });
      if (failed.length === 0) {
        toast.success(done(targets.length));
        props.onClear();
        return;
      }
      setRefused(failed);
      props.onKeep(failed.map((item) => item.id));
    });
  };
  const assign = (member: Member) => {
    const name = member.displayName ?? member.email;
    // Every record goes, those the list shows already there too: the list may be stale, and the
    // server's answer is the one that counts (a repeat changes nothing there).
    run(
      async (item) =>
        await assignOne(props.workspaceId, item.id, item.version, member.userId, {
          refreshPage: false,
        }),
      (many) => t('done_assign', { records: records(many), name }),
    );
  };
  const moveLeads = (status: (typeof LEAD_TARGETS)[number], reason = '') => {
    const label = tStatus(`status_${status}`);
    run(
      async (item) =>
        await changeLeadStatus(
          props.workspaceId,
          item.id,
          versionOf(item),
          { status, reason },
          { refreshPage: false },
        ),
      (many) => t('done_move', { records: records(many), status: label }),
    );
  };
  const moveDeals = (stage: StageRef, lostReason?: string) => {
    run(
      async (item) =>
        await moveDeal(
          props.workspaceId,
          item.id,
          { stageId: stage.id, version: versionOf(item), lostReason },
          { refreshPage: false },
        ),
      (many) => t('done_move', { records: records(many), status: stage.name }),
    );
  };
  const moveTasks = (
    action: typeof completeTask,
    done: 'done_complete' | 'done_reopen' | 'done_cancel',
  ) => {
    run(
      async (item) =>
        await action(props.workspaceId, item.id, versionOf(item), { refreshPage: false }),
      (many) => t(done, { count: many }),
    );
  };
  const statusItems = () => {
    if (props.entity === 'lead') {
      return LEAD_TARGETS.map((status) => (
        <StatusOption
          key={status}
          tone={LEAD_STATUS_TONES[status]}
          label={tStatus(`status_${status}`)}
          onSelect={() => {
            if (status === 'UNQUALIFIED') {
              // Not moved yet: the reason comes first.
              setAsking('reason');
            } else {
              moveLeads(status);
            }
          }}
        />
      ));
    }
    if (props.entity === 'deal') {
      const stages = props.stages ?? [];
      return stages.map((stage) => (
        <StatusOption
          key={stage.id}
          tone={stageTone(stages, stage.id)}
          label={stage.name}
          onSelect={() => {
            if (stage.kind === 'LOST') {
              setLosing(stage);
              setAsking('reason');
            } else {
              moveDeals(stage);
            }
          }}
        />
      ));
    }
    return [
      allowed.open && (
        <StatusOption
          key="complete"
          tone={TASK_STATUS_TONES.COMPLETED}
          label={t('complete')}
          onSelect={() => {
            moveTasks(completeTask, 'done_complete');
          }}
        />
      ),
      allowed.open && (
        <StatusOption
          key="cancel"
          tone={TASK_STATUS_TONES.CANCELLED}
          label={t('cancel_tasks')}
          onSelect={() => {
            setAsking('cancel');
          }}
        />
      ),
      allowed.closed && (
        <StatusOption
          key="reopen"
          tone={TASK_STATUS_TONES.OPEN}
          label={t('reopen')}
          onSelect={() => {
            moveTasks(reopenTask, 'done_reopen');
          }}
        />
      ),
    ];
  };
  const deal = props.entity === 'deal';
  // A control that stays while records are on their way, but does nothing.
  const busy = isPending || undefined;

  const bar = (
    // In the shell's strip at the foot of the canvas (under the list where there is none, as in a
    // test); only the bar takes the pointer, not the strip it is centred in.
    <div data-bulk-bar className="pointer-events-none mt-4 flex justify-center px-4 sm:px-7">
      <div className="pointer-events-auto relative flex max-w-full flex-col items-center">
        {refused.length > 0 && (
          <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
            <RefusedAlert
              refused={refused}
              total={progress.total}
              onDismiss={() => {
                setRefused([]);
              }}
            />
          </div>
        )}
        {(count > 0 || isPending) && (
          // One Tab stop; the arrow keys move between its controls. One row: the count and × stay,
          // and the actions between them scroll inside the bar should they not fit, never the page.
          <TooltipProvider>
            <Toolbar.Root
              aria-label={t('selected', { count })}
              // In dark the raised ink, so it stands off the violet-black canvas by more than its ring.
              className="flex max-w-full items-center gap-1 rounded-lg bg-rail p-1.5 text-on-rail shadow-float ring-1 ring-white/10 dark:bg-rail-raised"
            >
              <BarCount
                count={count}
                pending={isPending}
                progress={progress}
                locked={allowed.locked}
                converted={allowed.converted}
              />
              {/* Its padding keeps the focus ring of the first and last action unclipped. */}
              <div className="-mx-1 -my-1.5 flex min-w-0 [scrollbar-width:thin] [scrollbar-color:rgb(255_255_255/30%)_transparent] items-center gap-1 overflow-x-auto px-1 py-1.5">
                <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-white/20" />
                {allowed.assign && (
                  <BarMenu
                    icon={<UserRoundIcon data-icon="inline-start" />}
                    label={t('assign')}
                    menuLabel={t('assign_to')}
                    busy={isPending}
                    name="assign"
                  >
                    {props.members.map((member) => (
                      <DropdownMenuItem
                        key={member.userId}
                        onSelect={() => {
                          assign(member);
                        }}
                      >
                        <PersonAvatar person={member} size="xs" />
                        <span className="truncate">{member.displayName ?? member.email}</span>
                      </DropdownMenuItem>
                    ))}
                  </BarMenu>
                )}
                {allowed.status && (
                  <BarMenu
                    icon={<CircleDotIcon data-icon="inline-start" />}
                    label={deal ? t('stage') : t('status')}
                    menuLabel={t('move_to')}
                    busy={isPending}
                    name="status"
                  >
                    {statusItems()}
                  </BarMenu>
                )}
                {allowed.restore && restore && (
                  <PhoneTip label={t('restore')}>
                    <Toolbar.Button asChild>
                      <Button
                        variant="ghost"
                        aria-label={t('restore')}
                        aria-disabled={busy}
                        className={ON_BAR}
                        onClick={() => {
                          run(
                            async (item) =>
                              await restore(props.workspaceId, item.id, { refreshPage: false }),
                            (many) => t('done_restore', { records: records(many) }),
                          );
                        }}
                      >
                        <ArchiveRestoreIcon data-icon="inline-start" />
                        <span className="max-sm:hidden">{t('restore')}</span>
                      </Button>
                    </Toolbar.Button>
                  </PhoneTip>
                )}
                {allowed.archive && (
                  <PhoneTip label={t('archive')}>
                    <Toolbar.Button asChild>
                      <Button
                        variant="ghost"
                        aria-label={t('archive')}
                        aria-disabled={busy}
                        className={ON_BAR}
                        onClick={() => {
                          if (!isPending) {
                            setAsking('archive');
                          }
                        }}
                      >
                        <ArchiveIcon data-icon="inline-start" />
                        <span className="max-sm:hidden">{t('archive')}</span>
                      </Button>
                    </Toolbar.Button>
                  </PhoneTip>
                )}
              </div>
              <Toolbar.Button asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('clear')}
                  title={t('clear')}
                  aria-disabled={busy}
                  className={ON_BAR}
                  onClick={() => {
                    if (!isPending) {
                      setRefused([]);
                      props.onClear();
                    }
                  }}
                >
                  <XIcon />
                </Button>
              </Toolbar.Button>
            </Toolbar.Root>
          </TooltipProvider>
        )}
      </div>

      <ConfirmAction
        open={asking === 'archive'}
        onOpenChange={(next) => {
          setAsking(next ? 'archive' : undefined);
        }}
        title={t('archive_title', { records: records(count) })}
        description={t('archive_text')}
        confirmLabel={tRecord('archive_confirm')}
        cancelLabel={tRecord('cancel')}
        action={async () => {
          // The dialog closes at once: the bar counts the records on their way.
          if (archive) {
            run(
              async (item) => await archive(props.workspaceId, item.id, { refreshPage: false }),
              (many) => t('done_archive', { records: records(many) }),
            );
          }
          return await Promise.resolve(CLOSE);
        }}
      />
      <ConfirmAction
        open={asking === 'cancel'}
        onOpenChange={(next) => {
          setAsking(next ? 'cancel' : undefined);
        }}
        returnFocus={statusMenu}
        title={t('cancel_title', { count })}
        description={t('cancel_text')}
        confirmLabel={t('cancel_confirm')}
        cancelLabel={t('keep')}
        action={async () => {
          moveTasks(cancelTask, 'done_cancel');
          return await Promise.resolve(CLOSE);
        }}
      />
      <LostReasonDialog
        open={asking === 'reason'}
        onOpenChange={(next) => {
          setAsking(next ? 'reason' : undefined);
        }}
        dealName=""
        text={
          deal
            ? {
                title: t('lost_title', { count }),
                description: t('lost_text'),
                submit: tLost('submit'),
              }
            : {
                title: t('unqualify_title', { count }),
                description: t('unqualify_text'),
                submit: tUnqualify('submit'),
              }
        }
        returnFocus={statusMenu}
        onConfirm={(reason) => {
          if (deal && losing) {
            moveDeals(losing, reason);
          } else {
            moveLeads('UNQUALIFIED', reason);
          }
        }}
      />
    </div>
  );
  const slot = document.querySelector(`#${BULK_BAR_SLOT}`);

  return slot ? createPortal(bar, slot) : bar;
};
