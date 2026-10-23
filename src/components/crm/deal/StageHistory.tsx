'use client';

import { ArrowRightIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId } from 'react';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import type { components } from '@/libs/api/schema';
import { formatInstant } from '@/libs/crm/Format';

type Change = components['schemas']['StageChangeResponse'];
type StageRef = components['schemas']['HistoryStageRef'];

/**
 * A deal's stage history, newest first: from one stage to the next (the first entry says where
 * the deal began), who moved it, as their avatar and name, and when. Each stage shows the name it
 * had then; one that has since been deleted says so, and signs nothing on the track. A
 * member who left reads "Former member", with no avatar: an avatar is only ever someone's.
 * @param props Component props.
 * @param props.history The entries, newest first, as the API lists them.
 * @param props.timeZone The workspace's time zone, for the times.
 * @returns The panel.
 */
export const StageHistory = (props: { history: Change[]; timeZone: string }) => {
  const t = useTranslations('StageHistory');
  const locale = useLocale();
  // Its own: a deal's page and its record panel over it show one each.
  const headingId = useId();
  const stageName = (stage: StageRef) =>
    stage.id === undefined ? t('stage_deleted', { name: stage.name }) : stage.name;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="px-5 pt-4 pb-3 text-sm font-semibold">
        {t('title')}
      </h2>
      {props.history.length === 0 ? (
        <p className="border-t border-rule px-5 py-4 text-muted-foreground">{t('empty')}</p>
      ) : (
        <ol>
          {props.history.map((change) => (
            // The move on the left; who and when on the right, a long name wrapping there.
            <li
              key={`${change.changedAt}-${change.toStage.id ?? change.toStage.name}`}
              className="flex items-start gap-4 border-t border-rule px-5 py-3 text-sm"
            >
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 font-medium break-words">
                {change.fromStage ? (
                  <>
                    {stageName(change.fromStage)}
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <span className="sr-only">{t('to')}</span>
                    {stageName(change.toStage)}
                  </>
                ) : (
                  t('created', { stage: stageName(change.toStage) })
                )}
              </span>
              <span className="flex max-w-[50%] flex-col items-end gap-0.5 text-right">
                {change.changedBy ? (
                  <span className="flex items-center gap-2">
                    <span className="[overflow-wrap:anywhere]">
                      {change.changedBy.displayName ?? change.changedBy.email}
                    </span>
                    <PersonAvatar person={change.changedBy} size="sm" />
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t('former_member')}</span>
                )}
                <time
                  dateTime={change.changedAt}
                  className="text-[0.8125rem] text-muted-foreground tabular-nums"
                >
                  {formatInstant(change.changedAt, {
                    locale,
                    timeZone: props.timeZone,
                    withTime: true,
                  })}
                </time>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
