'use client';

import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { usePathname, useRouter } from '@/libs/I18nNavigation';

const DEBOUNCE_MS = 250;

/**
 * The gallery's search box: typing replaces `?q=` in the URL (and drops `?page=`), so the
 * server filters the icons and the result can be linked.
 * @param props Component props.
 * @param props.defaultValue The current search text.
 * @returns The search field.
 */
export const IconSearch = (props: { defaultValue: string }) => {
  const t = useTranslations('IconGallery');
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const timer = useRef<number | null>(null);

  return (
    <search className="flex w-full flex-col gap-2 sm:max-w-sm">
      <Label htmlFor="icon-search">{t('search_label')}</Label>
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-600"
        />
        <Input
          id="icon-search"
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder={t('search_placeholder')}
          defaultValue={props.defaultValue}
          className="pr-9 pl-9"
          onChange={(event) => {
            const query = event.target.value.trim();
            window.clearTimeout(timer.current ?? undefined);
            timer.current = window.setTimeout(() => {
              startTransition(() => {
                const search = query ? `?${new URLSearchParams({ q: query }).toString()}` : '';
                router.replace(`${pathname}${search}`, { scroll: false });
              });
            }, DEBOUNCE_MS);
          }}
        />
        {pending && (
          <Spinner
            label={t('searching')}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-600"
          />
        )}
      </div>
    </search>
  );
};
