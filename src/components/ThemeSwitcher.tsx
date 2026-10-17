'use client';

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { startTransition, useOptimistic } from 'react';
import { setTheme } from '@/actions/ThemeActions';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Theme } from '@/libs/Theme';
import { applyTheme, parseTheme, THEMES } from '@/libs/Theme';

const ICONS = { light: SunIcon, dark: MoonIcon, system: MonitorIcon };

/**
 * Picks the colour theme: light, dark or the system's. The class on `<html>` changes at once; the
 * choice is then stored in the theme cookie for the next page load.
 * @param props Component props.
 * @param props.theme The current theme, read from the cookie on the server.
 * @returns The theme picker.
 */
export const ThemeSwitcher = (props: { theme: Theme }) => {
  const t = useTranslations('ThemeSwitcher');
  const [theme, setOptimisticTheme] = useOptimistic(props.theme);

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={theme}
      aria-label={t('label')}
      onValueChange={(value) => {
        // A single group can be emptied by clicking the chosen item again; keep the choice.
        if (!value) {
          return;
        }

        const next = parseTheme(value);
        startTransition(async () => {
          setOptimisticTheme(next);
          applyTheme(next);
          await setTheme(next);
        });
      }}
    >
      {THEMES.map((item) => {
        const Icon = ICONS[item];

        return (
          <ToggleGroupItem
            key={item}
            value={item}
            className="gap-1.5 px-3 data-[state=on]:border-seal-ink data-[state=on]:bg-seal-tint data-[state=on]:text-seal-ink"
          >
            <Icon aria-hidden="true" />
            {t(`theme_${item}`)}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
};
