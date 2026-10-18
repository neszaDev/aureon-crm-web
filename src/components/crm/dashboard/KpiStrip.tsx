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
 * The workspace's counts as one strip: a small label over a large tabular figure, each cell a
 * link to the list it counts. The figures are the API's, as of now. Overdue tasks, when there
 * are some, come with a warning icon besides the crimson, and the label says what they are.
 * @param props Component props.
 * @param props.counts The dashboard's `counts`.
 * @param props.workspaceId The workspace the links stay in.
 * @returns The strip.
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
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-5">
        {CELLS.map((cell) => {
          const value = props.counts[cell.field];
          const late = cell.field === 'overdueTasks' && value > 0;

          return (
            <li key={cell.key} className="bg-card last:max-sm:col-span-2">
              <Link
                href={`/app/${props.workspaceId}${cell.href}`}
                className="flex h-full flex-col gap-0.5 px-4 py-3.5 no-underline transition-colors duration-150 hover:bg-muted focus-visible:-outline-offset-2 sm:px-5"
              >
                <span className="text-[0.8125rem] font-medium text-muted-foreground">
                  {t(`cell_${cell.key}`)}
                </span>{' '}
                <span
                  className={cn(
                    'flex items-center gap-2 text-[1.75rem] leading-tight font-semibold text-foreground tabular-nums',
                    late && 'text-danger',
                  )}
                >
                  {late && <CircleAlertIcon aria-hidden="true" className="size-5 shrink-0" />}
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
