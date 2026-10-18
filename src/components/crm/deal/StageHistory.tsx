import { ArrowRightIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Seal } from '@/components/crm/Seal';
import type { components } from '@/libs/api/schema';
import { formatInstant } from '@/libs/crm/Format';

type Change = components['schemas']['StageChangeResponse'];
type StageRef = components['schemas']['HistoryStageRef'];

/**
 * A deal's stage history, newest first: from one stage to the next (the first entry says where
 * the deal began), who moved it, as their seal and name, and when. Each stage shows the name it
 * had then; one that has since been deleted says so, and signs nothing on the stamp row. A
 * member who left reads "Former member", with no seal: a seal is only ever someone's.
 * @param props Component props.
 * @param props.history The entries, newest first, as the API lists them.
 * @param props.timeZone The workspace's time zone, for the times.
 * @returns The panel.
 */
export const StageHistory = (props: { history: Change[]; timeZone: string }) => {
  const t = useTranslations('StageHistory');
  const locale = useLocale();
  const stageName = (stage: StageRef) =>
    stage.id === undefined ? t('stage_deleted', { name: stage.name }) : stage.name;

  return (
    <section
      aria-labelledby="stage-history-heading"
      className="rounded-lg border border-rule bg-card"
    >
      <h2 id="stage-history-heading" className="px-5 py-4 font-semibold">
        {t('title')}
      </h2>
      {props.history.length === 0 ? (
        <p className="border-t border-rule px-5 py-4 text-muted-foreground">{t('empty')}</p>
      ) : (
        <ol>
          {props.history.map((change) => (
            <li
              key={`${change.changedAt}-${change.toStage.id ?? change.toStage.name}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule px-5 py-3"
            >
              <span className="flex min-w-0 flex-1 basis-56 flex-wrap items-center gap-x-2 font-medium break-words">
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
              <span className="flex items-center gap-2 text-sm">
                {change.changedBy ? (
                  <>
                    <Seal
                      name={change.changedBy.displayName}
                      email={change.changedBy.email}
                      size="sm"
                    />
                    <span className="[overflow-wrap:anywhere]">
                      {change.changedBy.displayName ?? change.changedBy.email}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{t('former_member')}</span>
                )}
              </span>
              <time
                dateTime={change.changedAt}
                className="text-sm text-muted-foreground tabular-nums"
              >
                {formatInstant(change.changedAt, {
                  locale,
                  timeZone: props.timeZone,
                  withTime: true,
                })}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
