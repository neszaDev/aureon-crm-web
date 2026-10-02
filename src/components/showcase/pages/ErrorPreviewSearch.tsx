'use client';

import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * The error pages' "What are you looking for?" box. In this preview nothing is searched:
 * submitting says so, with the words typed.
 * @returns The search form.
 */
export const ErrorPreviewSearch = () => {
  const t = useTranslations('ErrorPreviewSearch');
  const id = useId();
  const [searched, setSearched] = useState<string | null>(null);

  return (
    <search className="w-full">
      <form
        className="flex w-full flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const query = new FormData(event.currentTarget).get('query');
          setSearched(typeof query === 'string' ? query.trim() : '');
        }}
      >
        <label htmlFor={id} className="sr-only">
          {t('label')}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
            />
            <Input
              id={id}
              name="query"
              type="search"
              placeholder={t('placeholder')}
              className="pl-9"
            />
          </div>
          <Button type="submit" className="h-10">
            {t('submit')}
          </Button>
        </div>
        <output className="block min-h-5 text-[0.8125rem] text-ink-600">
          {searched !== null &&
            (searched ? t('preview_result', { query: searched }) : t('preview_empty'))}
        </output>
      </form>
    </search>
  );
};
