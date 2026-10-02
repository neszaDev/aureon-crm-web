'use client';

import { cn } from 'cn';
import { MapPinIcon, SettingsIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DROPDOWN_WIDGETS } from './data';
import { Sparkline } from './Sparkline';
import { toneColor, toneSolid } from './tones';

/**
 * The row of four filled widgets, each with a figure, an options menu and a sparkline
 * (`WidgetsDropdown.vue`).
 * @returns The widget row.
 */
export const WidgetsDropdown = () => {
  const t = useTranslations('WidgetsDropdown');
  const format = useFormatter();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {DROPDOWN_WIDGETS.map((widget) => (
        <Card
          key={widget.id}
          className={cn('gap-0 border-transparent pb-0 text-folder-ink', toneSolid[widget.tone])}
        >
          <div className="flex items-start justify-between gap-2 px-4">
            <div>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {format.number(widget.value)}
              </p>
              <p className="text-folder-ink/85">{t('members_online')}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="inverse-ghost" size="icon-sm" aria-label={t('options')}>
                  {widget.icon === 'pin' ? <MapPinIcon /> : <SettingsIcon />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>{t('action')}</DropdownMenuItem>
                <DropdownMenuItem>{t('another_action')}</DropdownMenuItem>
                <DropdownMenuItem>{t('something_else')}</DropdownMenuItem>
                <DropdownMenuItem disabled>{t('disabled_action')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {widget.chart.kind === 'bar' ? (
            <Sparkline
              kind="bar"
              data={widget.chart.points}
              name={t('series')}
              color="var(--folder-ink)"
              fillOpacity={0.45}
              className="mt-3 h-[70px] px-4"
            />
          ) : (
            <Sparkline
              data={widget.chart.points}
              name={t('series')}
              color="var(--folder-ink)"
              pointed={widget.chart.pointed}
              linear={widget.chart.linear}
              dotColor={toneColor[widget.tone]}
              fill={widget.chart.area ? 'var(--folder-ink)' : undefined}
              fillOpacity={widget.chart.area ? 0.2 : undefined}
              strokeWidth={widget.chart.area ? 2.5 : undefined}
              className={cn('mt-3 h-[70px]', !widget.chart.area && 'px-4')}
            />
          )}
        </Card>
      ))}
    </div>
  );
};
