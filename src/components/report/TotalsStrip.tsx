import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import type { TestStatus } from '@/validations/TestResultValidation';
import { Mark } from './Mark';

const ORDER: TestStatus[] = ['PASSED', 'FAILED', 'PENDING'];

type Summary = {
  total?: number;
  byStatus?: { status?: TestStatus; count?: number }[];
};

/**
 * The totals box at the top of a card: the overall count, then one count per mark.
 * @param props Component props.
 * @param props.summary Totals from the backend's summary endpoint.
 * @param props.className Extra classes.
 * @returns The totals as a description list.
 */
export const TotalsStrip = (props: { summary?: Summary; className?: string }) => {
  const t = useTranslations('Totals');
  const tStatus = useTranslations('TestResultForm');
  const countOf = (status: TestStatus) =>
    props.summary?.byStatus?.find((entry) => entry.status === status)?.count ?? 0;

  return (
    <dl
      aria-label={t('label')}
      className={cn(
        'grid grid-cols-2 divide-ink-200 overflow-hidden rounded-sm border border-ink-300 bg-paper-card shadow-sheet sm:grid-cols-4 sm:divide-x',
        props.className,
      )}
    >
      <div className="flex flex-col gap-1 border-b border-ink-200 px-5 py-4 max-sm:odd:border-r sm:border-b-0">
        <dt className="form-label">{t('total')}</dt>
        <dd className="text-3xl font-semibold tracking-tight text-ink-950 tabular-nums">
          {props.summary?.total ?? 0}
        </dd>
      </div>
      {ORDER.map((status, index) => (
        <div
          key={status}
          data-testid={`summary-${status}`}
          className={cn(
            'flex flex-col gap-1 px-5 py-4 max-sm:odd:border-r',
            index === 0 && 'border-b border-ink-200 sm:border-b-0',
          )}
        >
          <dt className="form-label flex items-center gap-1.5">
            <Mark status={status} className="size-4" />
            {tStatus(`status_${status}`)}
          </dt>
          <dd
            className={cn(
              'text-3xl font-semibold tracking-tight tabular-nums',
              status === 'FAILED' && countOf(status) > 0 ? 'text-pen' : 'text-ink-950',
            )}
          >
            {countOf(status)}
          </dd>
        </div>
      ))}
    </dl>
  );
};
