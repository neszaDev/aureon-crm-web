import { cn } from 'cn';
import { CircleAlertIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { components } from '@/libs/api/schema';
import { Link } from '@/libs/I18nNavigation';

// Each count and the list it counts, under the workspace.
const CELLS = [
  { key: 'companies', field: 'companies', href: '/companies' },
  { key: 'contacts', field: 'contacts', href: '/contacts' },
  {
    key: 'open_leads',
    field: 'openLeads',
    href: '/leads?status=NEW&status=CONTACTED&status=QUALIFIED',
  },
  { key: 'open_deals', field: 'openDeals', href: '/deals?view=list&status=OPEN' },
  { key: 'overdue_tasks', field: 'overdueTasks', href: '/tasks?view=overdue' },
] as const;

/**
 * The workspace's counts as one line of figures, not tiles: each a label and its tabular figure,
 * a link to the list it counts, the five apart by hairlines and wrapping on a phone. The figures
 * are the API's, as of now. Overdue tasks, when there are some, come with a warning icon besides
 * the red, and the label says what they are.
 * @param props Component props.
 * @param props.counts The dashboard's `counts`.
 * @param props.workspaceId The workspace the links stay in.
 * @returns The line.
 */
export const KpiStrip = (props: {
  counts: components['schemas']['Counts'];
  workspaceId: number;
}) => {
  const t = useTranslations('KpiStrip');
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);

  return (
    <section aria-label={t('label')}>
      <ul className="-mx-2 flex flex-wrap items-center gap-x-1 gap-y-0.5">
        {CELLS.map((cell) => {
          const value = props.counts[cell.field];
          const late = cell.field === 'overdueTasks' && value > 0;

          return (
            <li
              key={cell.key}
              className="flex items-center sm:not-first:before:mr-2 sm:not-first:before:ml-1 sm:not-first:before:h-5 sm:not-first:before:w-px sm:not-first:before:bg-rule"
            >
              <Link
                href={`/app/${props.workspaceId}${cell.href}`}
                className="flex items-baseline gap-2 rounded-md px-2 py-1 no-underline transition-colors duration-150 hover:bg-ink/6"
              >
                <span className="text-[0.8125rem] font-medium text-muted-foreground">
                  {t(`cell_${cell.key}`)}
                </span>{' '}
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[1.125rem] leading-6 font-semibold text-foreground tabular-nums',
                    late && 'text-danger',
                  )}
                >
                  {late && <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0" />}
                  {number.format(value)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
