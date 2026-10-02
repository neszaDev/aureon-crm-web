import { cn } from 'cn';
import { CalendarIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { BrandIcon } from './BrandIcon';
import { BRAND_WIDGETS } from './data';
import { Sparkline } from './Sparkline';
import { toneSolid } from './tones';

/**
 * The row of social widgets: a filled logo band (with a sparkline behind it when `charts`)
 * over two figures (`WidgetsBrand.vue`).
 * @param props Component props.
 * @param props.charts Draws the sparkline in each band (the Vue default; `noCharts` turned it off).
 * @returns The widget row.
 */
export const WidgetsBrand = (props: { charts?: boolean }) => {
  const t = useTranslations('WidgetsBrand');
  const format = useFormatter();
  const names = {
    facebook: t('facebook'),
    twitter: t('twitter'),
    linkedin: t('linkedin'),
    calendar: t('calendar'),
  };
  const labels = {
    friends: t('friends'),
    feeds: t('feeds'),
    followers: t('followers'),
    tweets: t('tweets'),
    contacts: t('contacts'),
    events: t('events'),
    meetings: t('meetings'),
  };
  const figure = (value: number, options: { compact?: boolean; atLeast?: boolean }) => {
    if (options.atLeast) {
      return t('at_least', { count: value });
    }
    return format.number(value, options.compact ? { notation: 'compact' } : undefined);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {BRAND_WIDGETS.map((widget) => (
        <Card key={widget.id} className="gap-0 py-0">
          <div
            className={cn(
              'relative flex h-28 items-center justify-center overflow-hidden text-folder-ink',
              toneSolid[widget.tone],
            )}
          >
            {props.charts && (
              <Sparkline
                data={widget.points}
                name={labels[widget.left.label]}
                color="color-mix(in oklab, var(--folder-ink) 55%, transparent)"
                fill="var(--folder-ink)"
                fillOpacity={0.1}
                className="absolute inset-0 h-full"
              />
            )}
            {widget.icon === 'calendar' ? (
              <CalendarIcon aria-hidden="true" className="pointer-events-none relative size-12" />
            ) : (
              <BrandIcon brand={widget.icon} className="pointer-events-none relative size-12" />
            )}
            <span className="sr-only">{names[widget.icon]}</span>
          </div>
          <dl className="grid grid-cols-2 divide-x divide-ink-200 py-4 text-center">
            {[widget.left, widget.right].map((item) => (
              <div key={item.label} className="flex flex-col-reverse gap-1 px-2">
                <dt className="form-label">{labels[item.label]}</dt>
                <dd className="text-xl font-semibold tracking-tight text-ink-950 tabular-nums">
                  {figure(item.value, item)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}
    </div>
  );
};
