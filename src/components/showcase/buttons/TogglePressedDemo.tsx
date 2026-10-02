'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Toggle } from '@/components/ui/toggle';

const TOGGLES = [
  { variant: 'outline', size: 'sm' },
  { variant: 'outline', size: 'default' },
  { variant: 'outline', size: 'lg' },
  { variant: 'default', size: 'sm' },
  { variant: 'default', size: 'default' },
  { variant: 'default', size: 'lg' },
] as const;

/**
 * Six toggles bound to one pressed state, like the Vue `:pressed.sync` example: pressing any
 * of them flips all of them.
 * @returns The toggles.
 */
export const TogglePressedDemo = () => {
  const t = useTranslations('TogglePressedDemo');
  const [pressed, setPressed] = useState(false);
  const state = pressed ? t('on') : t('off');

  return (
    <div className="flex flex-wrap items-center gap-3">
      {TOGGLES.map((toggle) => (
        <Toggle
          key={`${toggle.variant}-${toggle.size}`}
          variant={toggle.variant}
          size={toggle.size}
          pressed={pressed}
          onPressedChange={setPressed}
        >
          {t(toggle.variant === 'outline' ? 'outline_label' : 'plain_label', {
            size: t(`size_${toggle.size}`),
            state,
          })}
        </Toggle>
      ))}
    </div>
  );
};
