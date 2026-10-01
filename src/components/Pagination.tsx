import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * Previous/next links with the current page, for zero-based `?page=` lists.
 * @param props Component props.
 * @param props.page Zero-based current page.
 * @param props.totalPages Number of pages.
 * @param props.href Builds the link for a page.
 * @returns The pagination nav, or nothing for a single page.
 */
export const Pagination = (props: {
  page: number;
  totalPages: number;
  href: (page: number) => string;
}) => {
  const t = useTranslations('TestResultsPage');

  if (props.totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label={t('pagination_label')}
      className="flex items-center justify-between gap-4 border-t border-ink-200 px-5 py-3 text-sm"
    >
      <span className="text-ink-600 tabular-nums">
        {t('page_of', { page: props.page + 1, total: props.totalPages })}
      </span>
      <div className="flex gap-2">
        {props.page > 0 && (
          <Button asChild variant="outline" size="sm">
            <Link href={props.href(props.page - 1)}>
              <ChevronLeftIcon data-icon="inline-start" />
              {t('previous_page')}
            </Link>
          </Button>
        )}
        {props.page + 1 < props.totalPages && (
          <Button asChild variant="outline" size="sm">
            <Link href={props.href(props.page + 1)}>
              {t('next_page')}
              <ChevronRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
};
