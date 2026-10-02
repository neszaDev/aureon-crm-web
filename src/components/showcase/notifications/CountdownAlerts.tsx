'use client';

import { XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ToneAlert } from './ToneAlert';

const DISMISS_SECONDS = 10;

/**
 * Two alerts that dismiss themselves after a countdown, one showing the seconds left and one
 * a progress bar; closing either stops the countdown, and the button starts it again.
 * They share one countdown, like the Vue page. It starts as soon as the page shows.
 * @param props Component props.
 * @param props.seconds Length of the countdown (default 10).
 * @returns The alerts and the restart button.
 */
export const CountdownAlerts = (props: { seconds?: number }) => {
  const t = useTranslations('AlertsPage');
  const seconds = props.seconds ?? DISMISS_SECONDS;
  const [remaining, setRemaining] = useState(seconds);

  // A one-second timer per tick: an external clock, so an effect is the right tool here.
  useEffect(() => {
    const timer =
      remaining > 0
        ? window.setTimeout(() => {
            setRemaining(remaining - 1);
          }, 1000)
        : undefined;
    return () => {
      window.clearTimeout(timer);
    };
  }, [remaining]);

  const close = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t('close')}
      onClick={() => {
        setRemaining(0);
      }}
    >
      <XIcon />
    </Button>
  );

  return (
    <div className="flex flex-col items-start gap-3">
      {remaining > 0 && (
        <>
          <ToneAlert
            tone="pencil"
            live="polite"
            action={close}
            className="animate-in duration-300 fade-in-0"
          >
            {t.rich('countdown_bold', {
              count: remaining,
              strong: (chunks) => <strong className="tabular-nums">{chunks}</strong>,
            })}
          </ToneAlert>
          <ToneAlert tone="folder" live="polite" action={close}>
            <p className="tabular-nums">{t('countdown_plain', { count: remaining })}</p>
            <Progress
              value={(remaining / seconds) * 100}
              aria-label={t('time_left')}
              className="mt-2 bg-folder/15"
            />
          </ToneAlert>
        </>
      )}
      <Button
        variant="secondary"
        onClick={() => {
          setRemaining(seconds);
        }}
      >
        {t('show_timer')}
      </Button>
    </div>
  );
};
