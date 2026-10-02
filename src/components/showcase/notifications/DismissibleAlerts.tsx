'use client';

import { XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToneAlert } from './ToneAlert';

/**
 * Two alerts that can be dismissed (one with a close icon, one with its own "Close" button)
 * and a button that brings both back.
 * @returns The alerts and the reset button.
 */
export const DismissibleAlerts = () => {
  const t = useTranslations('AlertsPage');
  const [first, setFirst] = useState(true);
  const [second, setSecond] = useState(true);

  return (
    <div className="flex flex-col items-start gap-3">
      {first && (
        <ToneAlert
          tone="muted"
          live="polite"
          className="animate-in duration-200 fade-in-0"
          action={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('close')}
              onClick={() => {
                setFirst(false);
              }}
            >
              <XIcon />
            </Button>
          }
        >
          {t('dismissible_text')}
        </ToneAlert>
      )}
      {second && (
        <ToneAlert
          tone="muted"
          live="polite"
          className="animate-in duration-200 fade-in-0 has-data-[slot=alert-action]:pr-24"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSecond(false);
              }}
            >
              {t('close')}
            </Button>
          }
        >
          {t('dismissible_custom_text')}
        </ToneAlert>
      )}
      <Button
        variant="secondary"
        onClick={() => {
          setFirst(true);
          setSecond(true);
        }}
      >
        {t('show_dismissible')}
      </Button>
    </div>
  );
};
