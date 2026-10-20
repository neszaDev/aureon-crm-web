'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { useLinkStatus } from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import type { PeriodQuery } from '@/libs/crm/PeriodQuery';
import { periodHref } from '@/libs/crm/PeriodQuery';
import type { ReportTab } from '@/libs/crm/Reports';
import { REPORT_TABS } from '@/libs/crm/Reports';
import { Link } from '@/libs/I18nNavigation';

// A spinner in the tab that was just followed, until its report arrives.
const Pending = () => {
  const { pending } = useLinkStatus();

  return pending ? <Spinner aria-hidden="true" className="size-3.5" /> : null;
};

/**
 * The reports as a row of links, one per tab (`?tab=`): the current one in weight and a fill
 * (`aria-current`), the followed one with a spinner until it answers. The period the page shows
 * goes with each link, so a range chosen on one report is still there on the next.
 * @param props Component props.
 * @param props.current The tab shown.
 * @param props.path The reports page's path.
 * @param props.period The period in the URL (what `parsePeriod` read).
 * @returns The navigation.
 */
export const ReportTabs = (props: { current: ReportTab; path: string; period: PeriodQuery }) => {
  const t = useTranslations('ReportTabs');

  return (
    <nav aria-label={t('label')}>
      <ul className="flex flex-wrap gap-1.5">
        {REPORT_TABS.map((tab) => (
          <li key={tab}>
            <Link
              href={periodHref(props.path, { tab }, props.period)}
              aria-current={tab === props.current ? 'page' : undefined}
              scroll={false}
              className={cn(
                'flex min-h-9 items-center gap-2 rounded-md px-3 text-[0.9375rem] no-underline transition-colors duration-150 hover:bg-muted',
                tab === props.current ? 'bg-muted font-semibold' : 'font-medium text-foreground',
              )}
            >
              {t(`tab_${tab}`)}
              <Pending />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
