'use client';

import { cn } from 'cn';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DemoCard } from '@/components/showcase/DemoCard';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import { pageItems } from './pageItems';

type PagerSize = 'sm' | 'default' | 'lg';

const LINK_SIZE = { sm: 'icon-sm', default: 'icon', lg: 'icon-lg' } as const;

const ALIGN = { start: 'justify-start', center: 'justify-center', end: 'justify-end' } as const;

/**
 * A CoreUI-style pagination bar: first/previous arrows, up to five slots of page numbers and
 * ellipses, next/last arrows. Arrows at the ends are disabled; the first/last arrows are dropped
 * on phones so the bar fits on one line.
 * @param props Component props.
 * @param props.label Accessible name of the bar.
 * @param props.page The current page.
 * @param props.pages Total number of pages.
 * @param props.onPage Called with the page to go to.
 * @param props.size Button size.
 * @param props.align Horizontal alignment.
 * @returns The pagination bar.
 */
const Pager = (props: {
  label: string;
  page: number;
  pages: number;
  onPage: (page: number) => void;
  size?: PagerSize;
  align?: keyof typeof ALIGN;
}) => {
  const t = useTranslations('PaginationsPage');
  const size = LINK_SIZE[props.size ?? 'default'];
  const { items, beforeDots, afterDots } = pageItems({
    activePage: props.page,
    pages: props.pages,
  });
  const atStart = props.page === 1;
  const atEnd = props.page === props.pages;

  const go = (event: React.MouseEvent, page: number) => {
    event.preventDefault();
    if (page !== props.page) {
      props.onPage(page);
    }
  };

  const arrow = (options: {
    key: string;
    page: number;
    disabled: boolean;
    label: string;
    icon: React.ReactNode;
    wide?: boolean;
  }) => (
    <PaginationItem key={options.key} className={cn(options.wide && 'max-sm:hidden')}>
      <PaginationLink
        href={`#page-${options.page}`}
        size={size}
        aria-label={options.label}
        aria-disabled={options.disabled || undefined}
        tabIndex={options.disabled ? -1 : undefined}
        className={cn(options.disabled && 'pointer-events-none opacity-50')}
        onClick={(event) => {
          go(event, options.page);
        }}
      >
        {options.icon}
      </PaginationLink>
    </PaginationItem>
  );

  return (
    <Pagination aria-label={props.label} className={ALIGN[props.align ?? 'start']}>
      <PaginationContent className="flex-wrap">
        {arrow({
          key: 'first',
          page: 1,
          disabled: atStart,
          label: t('first'),
          icon: <ChevronsLeftIcon />,
          wide: true,
        })}
        {arrow({
          key: 'previous',
          page: props.page - 1,
          disabled: atStart,
          label: t('previous'),
          icon: <ChevronLeftIcon />,
        })}
        {beforeDots && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {items.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href={`#page-${page}`}
              size={size}
              isActive={page === props.page}
              aria-label={t('page', { page })}
              className="tabular"
              onClick={(event) => {
                go(event, page);
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        {afterDots && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {arrow({
          key: 'next',
          page: props.page + 1,
          disabled: atEnd,
          label: t('next'),
          icon: <ChevronRightIcon />,
        })}
        {arrow({
          key: 'last',
          page: props.pages,
          disabled: atEnd,
          label: t('last'),
          icon: <ChevronsRightIcon />,
          wide: true,
        })}
      </PaginationContent>
    </Pagination>
  );
};

const PAGES = 10;

/**
 * The two Vue pagination cards (sizes and alignment), all six bars sharing one current page.
 * @returns The cards.
 */
export const PagerDemos = () => {
  const t = useTranslations('PaginationsPage');
  const [page, setPage] = useState(3);

  // Both cards print the page; only the first announces changes.
  const current = (live: boolean) => (
    <p className="tabular mt-6 text-sm text-ink-600" aria-live={live ? 'polite' : undefined}>
      {t('current', { page })}
    </p>
  );

  const example = (options: {
    id: string;
    title: string;
    size?: PagerSize;
    align?: keyof typeof ALIGN;
    className?: string;
  }) => (
    <section aria-labelledby={options.id} className={cn('flex flex-col gap-2', options.className)}>
      <h3 id={options.id} className="form-label">
        {options.title}
      </h3>
      <Pager
        label={options.title}
        page={page}
        pages={PAGES}
        onPage={setPage}
        size={options.size}
        align={options.align}
      />
    </section>
  );

  return (
    <>
      <DemoCard title={t('size_title')}>
        <div className="flex flex-col gap-6">
          {example({ id: 'pager-default', title: t('size_default') })}
          {example({ id: 'pager-small', title: t('size_small'), size: 'sm' })}
          {example({
            id: 'pager-large',
            title: t('size_large'),
            size: 'lg',
            className: 'max-lg:hidden',
          })}
        </div>
        {current(true)}
      </DemoCard>

      <DemoCard title={t('align_title')}>
        <div className="flex flex-col gap-6">
          {example({ id: 'pager-start', title: t('align_start') })}
          {example({ id: 'pager-center', title: t('align_center'), align: 'center' })}
          {example({ id: 'pager-end', title: t('align_end'), align: 'end' })}
        </div>
        {current(false)}
      </DemoCard>
    </>
  );
};
