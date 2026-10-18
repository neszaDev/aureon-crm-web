'use client';

import { CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { initialsOf } from '@/components/crm/Seal';
import { StampBox } from '@/components/crm/StampBox';
import type { components } from '@/libs/api/schema';
import { daysSince } from '@/libs/crm/Format';

type Member = components['schemas']['MemberRef'];
type Kind = 'OPEN' | 'WON' | 'LOST';
type Stage = { id: number; name: string; kind: Kind };
type State = 'reached' | 'current' | 'blank' | 'unknown' | 'won' | 'lost';

/**
 * One box of the row, with its name for assistive technology and, in a full row, the stage's
 * name under it. A reached stage carries the seal of its signer, or a tick when nobody signed
 * it; the open one its days; Won the seal colour (with the winner's seal, or a tick); Lost solid
 * ink with the word "Lost", never the seal colour and never a seal.
 * @param props Component props.
 * @param props.stage The stage.
 * @param props.state What the box shows.
 * @param props.days The days in the current stage.
 * @param props.member Who signed the stage, in a full row.
 * @param props.full Whether stage names show under the boxes.
 * @param props.press Whether the box plays the stamp-press.
 * @returns The list item.
 */
const StampRowBox = (props: {
  stage: Stage;
  state: State;
  days: number;
  member?: Member;
  full: boolean;
  press: boolean;
}) => {
  const t = useTranslations('StampRow');
  const { name } = props.stage;
  const signer = props.member && (props.member.displayName ?? props.member.email);
  const seal = props.member && initialsOf(props.member.displayName, props.member.email);
  const label = {
    reached: signer ? t('state_signed', { name, signer }) : t('state_reached', { name }),
    won: signer ? t('state_signed', { name, signer }) : t('state_reached', { name }),
    current: t('state_current', { name, count: props.days }),
    blank: t('state_blank', { name }),
    unknown: t('state_unknown', { name }),
    lost: t('state_lost', { name }),
  }[props.state];
  const ticked = (props.state === 'reached' || props.state === 'won') && !seal;

  return (
    <li className={props.full ? 'flex w-20 flex-col items-center gap-1.5 sm:w-24' : undefined}>
      <StampBox
        seal={seal}
        days={props.state === 'current' ? t('days_short', { count: props.days }) : undefined}
        filled={props.state === 'reached'}
        won={props.state === 'won'}
        lost={props.state === 'lost'}
        press={props.press}
      >
        {ticked && (
          <CheckIcon
            aria-hidden="true"
            className={props.state === 'won' ? 'size-4 text-on-seal' : 'size-4 text-foreground'}
          />
        )}
        {props.state === 'lost' && (
          <span
            aria-hidden="true"
            className="font-mono text-[0.625rem] leading-none font-bold tracking-tighter"
          >
            {t('lost_word')}
          </span>
        )}
        <span className="sr-only">{label}</span>
      </StampBox>
      {props.full && (
        <span
          aria-hidden="true"
          className="text-center text-[0.8125rem] leading-snug font-medium break-words"
        >
          {name}
        </span>
      )}
    </li>
  );
};

/**
 * What a stage's box shows for a deal: an open stage before the deal's is reached, its own is
 * current, the ones after are blank; a won deal has reached them all; a lost deal only the ones
 * the history signed (nothing is known of the others).
 * @param stage The stage.
 * @param index Its place among the open stages.
 * @param deal The deal's kind, its place among the open stages (-1 when closed) and the stages
 *   the history signed.
 * @param deal.kind The deal's stage kind.
 * @param deal.index Its place among the open stages.
 * @param deal.signed The ids of the stages with a signature.
 * @returns The state.
 */
const stateOf = (
  stage: Stage,
  index: number,
  deal: { kind: Kind; index: number; signed: Set<number> },
): State => {
  if (stage.kind === 'WON') {
    return deal.kind === 'WON' ? 'won' : 'blank';
  }
  if (stage.kind === 'LOST') {
    return 'lost';
  }
  if (deal.kind !== 'OPEN') {
    return deal.kind === 'WON' || deal.signed.has(stage.id) ? 'reached' : 'unknown';
  }
  if (index === deal.index) {
    return 'current';
  }

  return index < deal.index ? 'reached' : 'blank';
};

/**
 * A deal's progress as a stamp row: one fixed 36 px box for each open stage and one closing box.
 * The stages before the current one are reached; with `signatures` (full size) each carries the
 * seal of whoever moved the deal into it, tilted as pressed. The current open stage is outlined
 * in ink with its exact days ("8d"). A won deal fills the closing box with the seal colour; a
 * lost one marks it in solid ink with the word "Lost", never in the seal colour, and shows only
 * the stages the history signed. A compact row (a board card) fills the reached boxes without
 * seals or stage names. Every box says its state to assistive technology. The box that becomes
 * current after a move (a refresh with a new stage) is pressed (full size only).
 * @param props Component props.
 * @param props.stages The pipeline's stages, in order: the open ones, then Won and Lost.
 * @param props.current The deal's stage, its kind and when it entered it.
 * @param props.current.stageId The stage's id.
 * @param props.current.kind Its kind.
 * @param props.current.enteredAt When the deal entered it (an ISO instant), for the days.
 * @param props.signatures Who moved the deal into each stage (`stageSignatures`); a stage
 *   without one is filled, or left blank for a lost deal, and carries no seal.
 * @param props.now The current time, which the days run to.
 * @param props.size `full` (stage names under the boxes, seals) or `compact`.
 * @returns The row.
 */
export const StampRow = (props: {
  stages: Stage[];
  current: { stageId: number; kind: Kind; enteredAt: string };
  signatures?: Record<number, Member | undefined>;
  now: Date;
  size: 'compact' | 'full';
}) => {
  const t = useTranslations('StampRow');
  const full = props.size === 'full';
  // The stage the last render showed as current, and the one to press: a refresh after a move
  // changes it, a first load never does.
  const [seen, setSeen] = useState(props.current.stageId);
  const [pressed, setPressed] = useState<number>();
  if (seen !== props.current.stageId) {
    setSeen(props.current.stageId);
    setPressed(props.current.stageId);
  }

  const open = props.stages.filter((stage) => stage.kind === 'OPEN');
  // An open deal closes with the Won box, still blank; a closed one with its own stage.
  const closing =
    props.current.kind === 'OPEN'
      ? props.stages.find((stage) => stage.kind === 'WON')
      : (props.stages.find((stage) => stage.id === props.current.stageId) ??
        props.stages.find((stage) => stage.kind === props.current.kind));
  const deal = {
    kind: props.current.kind,
    index: open.findIndex((stage) => stage.id === props.current.stageId),
    signed: new Set(
      Object.entries(props.signatures ?? {}).flatMap(([id, member]) =>
        member ? [Number(id)] : [],
      ),
    ),
  };
  const days = daysSince(props.current.enteredAt, props.now);
  const boxes = [...open, ...(closing ? [closing] : [])].map((stage, index) => ({
    stage,
    state: stateOf(stage, index, deal),
  }));

  return (
    <ol
      aria-label={t('label')}
      className={full ? 'flex flex-wrap gap-x-1 gap-y-3' : 'flex flex-wrap gap-1'}
    >
      {boxes.map(({ stage, state }) => (
        <StampRowBox
          key={stage.id}
          stage={stage}
          state={state}
          days={days}
          // A compact row draws no seals, so it names no signer either; the open box shows days,
          // and a lost deal's closing box is never signed.
          member={
            full && (state === 'reached' || state === 'won')
              ? props.signatures?.[stage.id]
              : undefined
          }
          full={full}
          press={full && state !== 'blank' && stage.id === pressed}
        />
      ))}
    </ol>
  );
};
