'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ChangeEventHandler } from 'react';
import { fieldStates, fieldSurface } from '@/components/ui/field-surface';
import { usePathname, useRouter } from '@/libs/I18nNavigation';
import { routing } from '@/libs/I18nRouting';

// Each tone restyles the select and its chevron from the wrapper.
const TONES = {
  canvas: '',
  folder:
    '[&_select]:border-white/25 [&_select]:bg-white/10 [&_select]:text-folder-ink [&_select]:shadow-none [&_select]:hover:border-white/50 [&_select]:focus-visible:border-folder-ink [&_select]:focus-visible:outline-folder-ink [&_svg]:text-folder-ink-soft',
  // On the brand field: a white outline and text (6.25:1 on Aureon violet), a darker fill on
  // hover, the focus outline in white (the page's violet one would sit on the violet).
  brand:
    '[&_select]:border-on-rail [&_select]:bg-transparent [&_select]:text-on-rail [&_select]:shadow-none [&_select]:hover:border-on-rail [&_select]:hover:bg-black/10 [&_select]:focus-visible:border-on-rail [&_select]:focus-visible:outline-on-rail [&_svg]:text-on-rail',
};

/**
 * The language picker: the UI kit's small native select (`NativeSelect`), drawn here without
 * its class merging (`cn`), whose rule tables the public pages would otherwise load for it alone.
 * @param props Component props.
 * @param props.tone `canvas` (default), `brand` on the violet fields of the public pages, or
 *   `folder` on the boilerplate demo's green.
 * @param props.className Extra classes.
 * @returns The picker.
 */
export const LocaleSwitcher = (props: { tone?: keyof typeof TONES; className?: string }) => {
  const t = useTranslations('LocaleSwitcher');
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    const newLocale = event.target.value;

    if (newLocale === locale) {
      return;
    }

    const { search } = window.location;
    router.push(`${pathname}${search}`, { locale: newLocale, scroll: false });
  };

  return (
    <div
      className={`relative w-[4.75rem] font-semibold ${TONES[props.tone ?? 'canvas']} ${props.className ?? ''}`}
    >
      <select
        data-size="sm"
        defaultValue={locale}
        onChange={handleChange}
        aria-label={t('change_language')}
        // NativeSelect's own classes, at its `sm` size.
        className={`${fieldSurface} ${fieldStates} h-10 w-full min-w-0 appearance-none py-2 pr-9 pl-3 select-none data-[size=sm]:h-8 data-[size=sm]:py-1 data-[size=sm]:pr-8 data-[size=sm]:pl-2.5 data-[size=sm]:text-sm`}
      >
        {routing.locales.map((elt) => (
          <option key={elt} value={elt} className="bg-[Canvas] text-[CanvasText]">
            {elt.toUpperCase()}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground select-none"
      />
    </div>
  );
};
