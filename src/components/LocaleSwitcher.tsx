'use client';

import { cn } from 'cn';
import { useLocale, useTranslations } from 'next-intl';
import type { ChangeEventHandler } from 'react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { usePathname, useRouter } from '@/libs/I18nNavigation';
import { routing } from '@/libs/I18nRouting';

export const LocaleSwitcher = (props: { tone?: 'folder' | 'paper'; className?: string }) => {
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
    <NativeSelect
      size="sm"
      defaultValue={locale}
      onChange={handleChange}
      aria-label={t('change_language')}
      className={cn(
        'w-[4.75rem] font-semibold',
        props.tone === 'folder' &&
          '[&_select]:border-white/25 [&_select]:bg-white/10 [&_select]:text-folder-ink [&_select]:shadow-none [&_select]:hover:border-white/50 [&_select]:focus-visible:border-folder-ink [&_select]:focus-visible:ring-white/25 [&_svg]:text-folder-ink-soft',
        props.className,
      )}
    >
      {routing.locales.map((elt) => (
        <NativeSelectOption key={elt} value={elt}>
          {elt.toUpperCase()}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
};
