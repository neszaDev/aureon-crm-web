'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref, PAGE_SIZES } from '@/libs/crm/ListQuery';
import { Link, useRouter } from '@/libs/I18nNavigation';

/**
 * Under a list: which rows show ("1–20 of 134"), the page size, and the previous and next pages.
 * @param props Component props.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @param props.total How many rows match.
 * @returns The pager.
 */
export const ListPager = (props: { path: string; query: ListQuery; total: number }) => {
  const t = useTranslations('RecordList');
  const router = useRouter();
  const { page, size } = props.query;
  const from = Math.min(props.total, page * size + 1);
  const to = Math.min(props.total, (page + 1) * size);
  const pageHref = (target: number) =>
    listHref(props.path, props.query, { page: target > 0 ? String(target) : undefined });

  return (
    <nav
      aria-label={t('pager_label')}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-rule px-4 py-3 sm:px-5"
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        {t('range', { from, to, total: props.total })}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {t('page_size')}
          <NativeSelect
            size="sm"
            value={String(size)}
            className="w-20"
            onChange={(event) => {
              router.push(listHref(props.path, props.query, { size: event.target.value }), {
                scroll: false,
              });
            }}
          >
            {PAGE_SIZES.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <div className="flex gap-2">
          {page > 0 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page - 1)}>
                <ChevronLeftIcon data-icon="inline-start" />
                {t('previous')}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeftIcon data-icon="inline-start" />
              {t('previous')}
            </Button>
          )}
          {to < props.total ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page + 1)}>
                {t('next')}
                <ChevronRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t('next')}
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
