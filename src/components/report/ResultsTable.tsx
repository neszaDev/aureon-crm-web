import { cn } from 'cn';
import { useFormatter, useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TestStatus } from '@/validations/TestResultValidation';
import { StatusMark } from './StatusMark';

export type ResultRow = {
  id?: number;
  testName?: string;
  status?: TestStatus;
  score?: number;
  testedAt?: string;
  notes?: string;
};

type ResultsTableProps = {
  rows: ResultRow[];
  /** Shown inside the ruled, empty card when there are no rows. */
  empty?: React.ReactNode;
  /** Renders the last cell of each row (e.g. a delete button). */
  renderActions?: (row: ResultRow) => React.ReactNode;
  /** Rows whose marks draw on, with the delay for each, in milliseconds. */
  drawDelays?: Map<number | undefined, number>;
  density?: 'default' | 'compact';
  className?: string;
};

/**
 * The ruled rows of a report card: mark, test name (with its note), score and date.
 * Used on the landing page with sample data and in the app with real results.
 * @param props Component props.
 * @returns The results as a table, or the empty card.
 */
export const ResultsTable = (props: ResultsTableProps) => {
  const t = useTranslations('ResultsTable');
  const format = useFormatter();
  const compact = props.density === 'compact';
  const columns = props.renderActions ? 5 : 4;
  // The compact card shows the day only; the app shows the time too.
  const dateFormat = compact
    ? ({ dateStyle: 'medium' } as const)
    : ({ dateStyle: 'medium', timeStyle: 'short' } as const);

  return (
    <Table className={cn(compact ? 'text-[0.8125rem]' : 'text-sm', props.className)}>
      <TableHeader>
        <TableRow>
          <TableHead className="sm:w-[38%]">{t('column_name')}</TableHead>
          <TableHead>{t('column_status')}</TableHead>
          <TableHead className="text-right">{t('column_score')}</TableHead>
          <TableHead className="hidden sm:table-cell">{t('column_tested_at')}</TableHead>
          {props.renderActions && (
            <TableHead>
              <span className="sr-only">{t('column_actions')}</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.length === 0 && props.empty ? (
          <>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns} className="whitespace-normal">
                <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                  {props.empty}
                </div>
              </TableCell>
            </TableRow>
            {/* Honest absence: the card keeps its ruled rows even when nothing is on it. */}
            {[0, 1, 2].map((blank) => (
              <TableRow key={blank} aria-hidden="true" className="hover:bg-transparent">
                <TableCell colSpan={columns} className="h-12" />
              </TableRow>
            ))}
          </>
        ) : (
          props.rows.map((row) => {
            const testedAt = row.testedAt ? new Date(row.testedAt) : undefined;
            const delay = props.drawDelays?.get(row.id);

            return (
              <TableRow key={row.id ?? row.testName}>
                <TableCell className={cn('whitespace-normal', compact && 'py-2.5')}>
                  <span className="block font-semibold text-ink-950">{row.testName}</span>
                  {row.notes && (
                    <span className="mt-0.5 block font-hand text-[0.9375rem] leading-snug text-ink-600">
                      {row.notes}
                    </span>
                  )}
                  {testedAt && (
                    <time
                      dateTime={row.testedAt}
                      className="mt-0.5 block text-xs text-ink-600 sm:hidden"
                    >
                      {format.dateTime(testedAt, dateFormat)}
                    </time>
                  )}
                </TableCell>
                <TableCell className={cn(compact && 'py-2.5')}>
                  <StatusMark
                    status={row.status ?? 'PENDING'}
                    animate={delay !== undefined}
                    delay={delay}
                    labelClassName="max-sm:sr-only"
                  />
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right text-base font-semibold text-ink-950 tabular-nums',
                    compact && 'py-2.5',
                  )}
                >
                  {format.number(row.score ?? 0)}
                </TableCell>
                <TableCell className={cn('hidden text-ink-600 sm:table-cell', compact && 'py-2.5')}>
                  {testedAt && (
                    <time dateTime={row.testedAt}>{format.dateTime(testedAt, dateFormat)}</time>
                  )}
                </TableCell>
                {props.renderActions && (
                  <TableCell className="text-right">{props.renderActions(row)}</TableCell>
                )}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
