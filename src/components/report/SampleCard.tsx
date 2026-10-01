import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { TEST_STATUSES } from '@/validations/TestResultValidation';
import type { ResultRow } from './ResultsTable';
import { ResultsTable } from './ResultsTable';
import { TotalsStrip } from './TotalsStrip';

// Synthetic rows for the landing page. Labelled "Sample data" on the card itself.
const SAMPLE = [
  { id: 1, status: 'PASSED', score: 94, testedAt: '2026-09-28T09:30:00Z' },
  {
    id: 2,
    hasNote: true,
    status: 'FAILED',
    score: 58,
    testedAt: '2026-09-24T14:00:00Z',
  },
  { id: 3, status: 'PASSED', score: 88, testedAt: '2026-09-19T08:15:00Z' },
  { id: 4, status: 'PASSED', score: 100, testedAt: '2026-09-12T16:45:00Z' },
  {
    id: 5,
    hasNote: true,
    status: 'PENDING',
    score: 81,
    testedAt: '2026-09-09T11:00:00Z',
  },
  { id: 6, status: 'PASSED', score: 72, testedAt: '2026-09-03T07:20:00Z' },
] as const;

/**
 * The filled-in report card on the landing page: the real results table and totals,
 * fed with sample rows, with marks that draw on one after another.
 * @returns The sample card.
 */
export const SampleCard = () => {
  const t = useTranslations('Index');
  const rows: ResultRow[] = SAMPLE.map((row) => ({
    id: row.id,
    status: row.status,
    score: row.score,
    testedAt: row.testedAt,
    testName: t(`sample_${row.id}_name`),
    notes: 'hasNote' in row ? t(`sample_${row.id}_note`) : undefined,
  }));
  const drawDelays = new Map(rows.map((row, index) => [row.id, 500 + index * 220]));

  return (
    <figure aria-label={t('sample_tag')} className="paper relative isolate overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b-[3px] border-double border-ink-300 px-5 pt-5 pb-4 sm:px-7">
        <div className="flex flex-col gap-1">
          <p className="text-xl font-bold tracking-[-0.01em] text-ink-950 sm:text-2xl">
            {t('card_title')}
          </p>
        </div>
        <Badge variant="outline" className="mt-1 bg-ply">
          {t('sample_tag')}
        </Badge>
      </div>

      <dl className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3 border-b border-ink-200 px-5 py-3 sm:px-7">
        <dt className="form-label">{t('card_name_label')}</dt>
        <dd className="font-hand text-lg leading-none text-ink-700">{t('card_name')}</dd>
        <dd className="text-sm font-medium text-ink-600">{t('card_term')}</dd>
      </dl>

      <div className="px-2 sm:px-4">
        <ResultsTable rows={rows} drawDelays={drawDelays} density="compact" />
      </div>

      <div className="grid gap-4 border-t border-ink-300 px-5 pt-4 pb-5 sm:px-7">
        <div className="flex flex-col gap-1">
          <p className="form-label">{t('remark_label')}</p>
          <p className="write-on font-hand text-xl leading-snug text-ink-700 sm:text-[1.375rem]">
            {t('remark')}
          </p>
        </div>
        <TotalsStrip
          className="shadow-none"
          summary={{
            total: rows.length,
            byStatus: TEST_STATUSES.map((status) => ({
              status,
              count: rows.filter((row) => row.status === status).length,
            })),
          }}
        />
      </div>
    </figure>
  );
};
