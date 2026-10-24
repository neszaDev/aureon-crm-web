'use client';

import { cn } from 'cn';
import { useLocale, useTranslations } from 'next-intl';
import { Satellite } from '@/components/brand/AureonMark';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StageSigner } from '@/libs/crm/DealHistory';
import { daysSince, formatInstant } from '@/libs/crm/Format';
import type { StageRef } from '@/libs/crm/Stages';
import { stageTone } from '@/libs/crm/StatusColors';

type State = 'reached' | 'current' | 'blank' | 'unknown' | 'won' | 'lost';

// The orbit's satellite over the end of the deal's own segment, in its colour: past the bar, as
// the mark's sits past its ring.
const SATELLITE = '-top-[7px] -right-0.5 text-(--tone)';

/**
 * What a segment shows for a deal: an open deal has reached the stages before its own and none
 * after; a won deal has reached them all; a lost deal only those the history has a move into
 * (nothing is known of the others). A closed deal's own stage closes the track.
 * @param stage The segment's stage.
 * @param index Its place on the track.
 * @param deal The deal's stage, its place among the open stages and the stages with a move.
 * @param deal.stage The deal's stage.
 * @param deal.index Its place among the open stages (-1 when closed).
 * @param deal.moved The stages the history has a move into.
 * @returns The state.
 */
const stateOf = (
  stage: StageRef,
  index: number,
  deal: { stage: StageRef; index: number; moved: Record<number, unknown> },
): State => {
  if (stage.kind === 'WON' || stage.kind === 'LOST') {
    return stage.kind === 'WON' ? 'won' : 'lost';
  }
  if (deal.stage.kind === 'WON') {
    return 'reached';
  }
  if (deal.stage.kind === 'LOST') {
    return stage.id in deal.moved ? 'reached' : 'unknown';
  }
  if (index === deal.index) {
    return 'current';
  }

  return index < deal.index ? 'reached' : 'blank';
};

/**
 * A deal's progress as a segmented track: one segment per open stage, filled up to its own in the
 * colour of its stage (`stageTone`), the orbit's satellite over the deal's own, then its stage's
 * name and days in it written beside (or, in full, each stage's name under its segment), so neither
 * colour nor the satellite is ever the only cue; a closed deal adds its Won or Lost segment. The
 * track's name says it all at once ("Stage 2 of 4: Needs analysis"). Each segment's tooltip, and
 * its screen-reader text, says its state, who moved the deal there and when (the current and the
 * closing stage always know when; a reached one when `signatures` does), or that a former member
 * did.
 * @param props Component props.
 * @param props.stages The pipeline's stages, in order: the open ones, then Won and Lost.
 * @param props.stage The deal's stage.
 * @param props.enteredAt When the deal entered it (an ISO instant), for the days.
 * @param props.signatures Who moved the deal into each stage, and when (`stageSignatures`,
 *   `signaturesOf`).
 * @param props.now The current time, which the days run to.
 * @param props.timeZone The workspace's time zone, for the dates.
 * @param props.full Whether to write it all out, as a record's header does: each stage's name
 *   under its segment (the current one's days beside it), and under that who moved the deal there
 *   and when.
 * @param props.unnamed Leaves the stage's name out of a compact track, the days kept: on a board
 *   card, whose column says the stage. The track's own name still says it.
 * @param props.className Extra classes.
 * @returns The track.
 */
export const StatusTrack = (props: {
  stages: StageRef[];
  stage: StageRef;
  enteredAt: string;
  signatures?: Record<number, StageSigner>;
  now: Date;
  timeZone: string;
  full?: boolean;
  unnamed?: boolean;
  className?: string;
}) => {
  const t = useTranslations('StatusTrack');
  const locale = useLocale();
  const signatures = props.signatures ?? {};
  const open = props.stages.filter((stage) => stage.kind === 'OPEN');
  const index = open.findIndex((stage) => stage.id === props.stage.id);
  const closed = props.stage.kind !== 'OPEN';
  const days = daysSince(props.enteredAt, props.now);
  const segments = [...open, ...(closed ? [props.stage] : [])].map((stage, place) => {
    const state = stateOf(stage, place, { stage: props.stage, index, moved: signatures });
    const own = stage.id === props.stage.id;
    // Who and when: a stage never reached has neither, and the deal's own stage always knows when.
    const signer = state === 'blank' || state === 'unknown' ? undefined : signatures[stage.id];
    const at = own ? props.enteredAt : signer?.at;
    let mover = 'none';
    if (signer) {
      mover = signer.by ? 'member' : 'left';
    }
    const by = signer?.by?.displayName ?? signer?.by?.email ?? '';
    const when = at ? formatInstant(at, { locale, timeZone: props.timeZone }) : undefined;
    const label = t('segment', {
      name: stage.name,
      state,
      days,
      mover,
      signer: by,
      when: when ?? 'none',
    });
    // Who and when, written under a full track's segment; a former member is said so.
    const byline = [mover === 'left' ? t('former_member') : by, when].filter(Boolean).join(' · ');

    return { stage, label, own, byline, filled: state !== 'blank' && state !== 'unknown' };
  });
  const name = closed
    ? t('closed', { name: props.stage.name, kind: props.stage.kind })
    : t('open', { index: index + 1, count: open.length, name: props.stage.name });

  const tone = stageTone(props.stages, props.stage.id);

  if (props.full) {
    return (
      <div data-tone={tone} className={cn('flex flex-col gap-1.5', props.className)}>
        <TooltipProvider delayDuration={200}>
          <ol aria-label={name} className="flex gap-1">
            {segments.map((segment) => (
              <Tooltip key={segment.stage.id}>
                <TooltipTrigger asChild>
                  <li className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'relative block h-1.5 rounded-full',
                        segment.filled ? 'bg-(--tone)' : 'bg-rule',
                      )}
                    >
                      {segment.own && <Satellite className={SATELLITE} />}
                    </span>
                    {/* A phone's segments are too narrow for names: the line under the track says it. */}
                    <span
                      aria-hidden="true"
                      className="flex min-w-0 flex-col text-[0.75rem] max-sm:hidden"
                    >
                      <span className="flex min-w-0 items-baseline gap-1">
                        <span
                          className={cn(
                            'truncate font-medium',
                            segment.own && 'font-semibold text-(--tone-ink)',
                            !segment.filled && 'text-muted-foreground',
                          )}
                        >
                          {segment.stage.name}
                        </span>
                        {segment.own && !closed && (
                          <span className="shrink-0 text-muted-foreground tabular-nums">
                            {t('days_short', { count: days })}
                          </span>
                        )}
                      </span>
                      <span className="min-h-[1.2em] truncate text-[0.6875rem] text-muted-foreground tabular-nums">
                        {segment.byline}
                      </span>
                    </span>
                    <span className="sr-only">{segment.label}</span>
                  </li>
                </TooltipTrigger>
                <TooltipContent>{segment.label}</TooltipContent>
              </Tooltip>
            ))}
          </ol>
        </TooltipProvider>
        <p
          aria-hidden="true"
          className="flex min-w-0 items-baseline gap-1 text-xs font-medium text-(--tone-ink) sm:hidden"
        >
          <span className="truncate">{props.stage.name}</span>
          {!closed && (
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {t('days_short', { count: days })}
            </span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div data-tone={tone} className={cn('flex min-w-0 items-center gap-2', props.className)}>
      <TooltipProvider delayDuration={200}>
        <ol aria-label={name} className="flex min-w-14 flex-1 gap-0.5">
          {segments.map((segment) => (
            <Tooltip key={segment.stage.id}>
              <TooltipTrigger asChild>
                {/* The segment's room is taller than its bar, so a pointer finds it. */}
                <li className="flex-1 py-1.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'relative block h-1.5 rounded-full',
                      segment.filled ? 'bg-(--tone)' : 'bg-rule',
                    )}
                  >
                    {segment.own && <Satellite className={SATELLITE} />}
                  </span>
                  <span className="sr-only">{segment.label}</span>
                </li>
              </TooltipTrigger>
              <TooltipContent>{segment.label}</TooltipContent>
            </Tooltip>
          ))}
        </ol>
      </TooltipProvider>
      <span
        aria-hidden="true"
        className="flex min-w-0 shrink items-baseline gap-1 text-xs font-medium text-(--tone-ink)"
      >
        {!props.unnamed && (
          <span title={props.stage.name} className="truncate">
            {props.stage.name}
          </span>
        )}
        {!closed && (
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {t('days_short', { count: days })}
          </span>
        )}
      </span>
    </div>
  );
};
