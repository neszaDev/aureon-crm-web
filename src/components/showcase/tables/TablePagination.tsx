'use client';

import { cn } from 'cn';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MoreHorizontalIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import { pageWindow } from './pageWindow';

/**
 * Page buttons for a client-side list (CoreUI's `CPagination`): first/last, previous/next and a
 * window of page numbers.
 * @param props Component props.
 * @param props.page Current page, one-based.
 * @param props.pages Number of pages.
 * @param props.onPageChange Called with the chosen page.
 * @param props.doubleArrows Show the first and last page buttons.
 * @param props.align Horizontal placement.
 * @param props.className Extra classes.
 * @returns The pagination nav, or nothing for a single page.
 */
export const TablePagination = (props: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  doubleArrows?: boolean;
  align?: 'start' | 'center' | 'end';
  className?: string;
}) => {
  const t = useTranslations('DataTable');

  if (props.pages <= 1) {
    return null;
  }

  const doubleArrows = props.doubleArrows ?? true;
  const first = props.page <= 1;
  const last = props.page >= props.pages;
  const arrow = (options: {
    target: number;
    disabled: boolean;
    label: string;
    icon: React.ReactNode;
  }) => (
    <PaginationItem>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={options.disabled}
        aria-label={options.label}
        onClick={() => {
          props.onPageChange(options.target);
        }}
      >
        {options.icon}
      </Button>
    </PaginationItem>
  );

  return (
    <Pagination
      aria-label={t('pagination_label')}
      className={cn(
        props.align === 'start' && 'justify-start',
        props.align === 'end' && 'justify-end',
        props.className,
      )}
    >
      <PaginationContent className="flex-wrap">
        {doubleArrows &&
          arrow({ target: 1, disabled: first, label: t('first_page'), icon: <ChevronsLeftIcon /> })}
        {arrow({
          target: props.page - 1,
          disabled: first,
          label: t('previous_page'),
          icon: <ChevronLeftIcon />,
        })}
        {pageWindow({ page: props.page, pages: props.pages }).map((slot, index) =>
          slot === 'gap' ? (
            <PaginationItem key={index === 0 ? 'gap-start' : 'gap-end'} aria-hidden="true">
              <span className="flex size-8 items-center justify-center text-ink-400">
                <MoreHorizontalIcon className="size-4" />
              </span>
            </PaginationItem>
          ) : (
            <PaginationItem key={slot}>
              <Button
                type="button"
                variant={slot === props.page ? 'outline' : 'ghost'}
                size="icon-sm"
                className="tabular-nums"
                aria-current={slot === props.page ? 'page' : undefined}
                aria-label={t('go_to_page', { page: slot })}
                onClick={() => {
                  props.onPageChange(slot);
                }}
              >
                {slot}
              </Button>
            </PaginationItem>
          ),
        )}
        {arrow({
          target: props.page + 1,
          disabled: last,
          label: t('next_page'),
          icon: <ChevronRightIcon />,
        })}
        {doubleArrows &&
          arrow({
            target: props.pages,
            disabled: last,
            label: t('last_page'),
            icon: <ChevronsRightIcon />,
          })}
      </PaginationContent>
    </Pagination>
  );
};
