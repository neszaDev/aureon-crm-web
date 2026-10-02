import { cn } from 'cn';
import { GlobeIcon, UserIcon, UserRoundIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { BrandIcon } from '@/components/showcase/widgets/BrandIcon';
import { ToneProgress } from '@/components/showcase/widgets/ToneProgress';
import type { Tone } from '@/components/showcase/widgets/tones';
import { toneBorder, toneFill } from '@/components/showcase/widgets/tones';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CLIENTS_BY_DAY, GENDER_SPLIT, SALES_CALLOUTS, SOURCES } from './data';
import { UsersTable } from './UsersTable';

// Monday 31 August 2026, the first day of the demo week.
const MONDAY = Date.UTC(2026, 7, 31);
const DAY_MS = 24 * 60 * 60 * 1000;

const Callout = (props: { label: string; value: string; tone: Tone }) => (
  <div className={cn('flex flex-col gap-1 border-l-4 py-1 pl-3', toneBorder[props.tone])}>
    <dt className="form-label">{props.label}</dt>
    <dd className="text-2xl font-semibold tracking-tight text-ink-950 tabular-nums">
      {props.value}
    </dd>
  </div>
);

const Swatch = (props: { tone: Tone; label: string }) => (
  <li className="flex items-center gap-1.5">
    <span aria-hidden="true" className={cn('size-2.5 rounded-full', toneFill[props.tone])} />
    {props.label}
  </li>
);

/**
 * The traffic and sales card of the dashboard: client callouts with bars per weekday, audience
 * by gender and source, and the users table.
 * @returns The card.
 */
export const TrafficSales = () => {
  const t = useTranslations('TrafficSales');
  const format = useFormatter();
  const percent = (value: number) => format.number(value / 100, { style: 'percent' });
  const sources = {
    organic: t('organic_search'),
    facebook: t('facebook'),
    twitter: t('twitter'),
    linkedin: t('linkedin'),
  };

  return (
    <Card className="gap-0">
      <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5">
        <CardTitle>
          <h2>{t('title')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 pt-5">
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-label={t('clients_label')} className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-4">
              <Callout
                label={t('new_clients')}
                value={format.number(SALES_CALLOUTS.newClients)}
                tone="ink"
              />
              <Callout
                label={t('recurring_clients')}
                value={format.number(SALES_CALLOUTS.recurringClients)}
                tone="pencil"
              />
            </dl>
            <Separator />
            <ul className="flex flex-col gap-4">
              {CLIENTS_BY_DAY.map((day, index) => {
                const name = format.dateTime(new Date(MONDAY + index * DAY_MS), {
                  weekday: 'long',
                  timeZone: 'UTC',
                });
                return (
                  <li key={name} className="grid grid-cols-[6rem_1fr] items-center gap-3">
                    <span className="text-[0.8125rem] text-ink-600">{name}</span>
                    <div className="flex flex-col gap-1">
                      <ToneProgress
                        value={day.fresh}
                        tone="ink"
                        label={t('bar_label', { series: t('new_clients'), day: name })}
                      />
                      <ToneProgress
                        value={day.recurring}
                        tone="pencil"
                        label={t('bar_label', { series: t('recurring_clients'), day: name })}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <ul className="flex justify-center gap-4 text-[0.8125rem] text-ink-700">
              <Swatch tone="ink" label={t('new_clients')} />
              <Swatch tone="pencil" label={t('recurring_clients')} />
            </ul>
          </section>

          <section aria-label={t('audience_label')} className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-4">
              <Callout
                label={t('pageviews')}
                value={format.number(SALES_CALLOUTS.pageviews)}
                tone="slate"
              />
              <Callout
                label={t('organic')}
                value={format.number(SALES_CALLOUTS.organic)}
                tone="pass"
              />
            </dl>
            <Separator />
            <ul className="flex flex-col gap-4">
              {(
                [
                  ['male', t('male'), <UserIcon key="male" aria-hidden="true" />],
                  ['female', t('female'), <UserRoundIcon key="female" aria-hidden="true" />],
                ] as const
              ).map(([id, label, icon]) => (
                <li key={id} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[0.8125rem] [&_svg]:size-4 [&_svg]:text-ink-600">
                    {icon}
                    <span className="text-ink-700">{label}</span>
                    <span className="ml-auto font-semibold text-ink-950 tabular-nums">
                      {percent(GENDER_SPLIT[id])}
                    </span>
                  </div>
                  <ToneProgress value={GENDER_SPLIT[id]} tone="slate" label={label} />
                </li>
              ))}
            </ul>
            <ul className="flex flex-col gap-4 pt-2">
              {SOURCES.map((source) => (
                <li key={source.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[0.8125rem]">
                    {source.brand ? (
                      <BrandIcon brand={source.brand} className="size-4 text-ink-600" />
                    ) : (
                      <GlobeIcon aria-hidden="true" className="size-4 text-ink-600" />
                    )}
                    <span className="text-ink-700">{sources[source.id]}</span>
                    <span className="ml-auto font-semibold text-ink-950 tabular-nums">
                      {format.number(source.count)}{' '}
                      <span className="font-normal text-ink-600">({percent(source.percent)})</span>
                    </span>
                  </div>
                  <ToneProgress value={source.percent} tone="pass" label={sources[source.id]} />
                </li>
              ))}
            </ul>
          </section>
        </div>
        <UsersTable />
      </CardContent>
    </Card>
  );
};
