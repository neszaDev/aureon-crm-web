import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

// A panel's outline: a hairline paper box with its heading and a few rows, as the dashboard's.
const Outline = (props: { rows: number; className?: string }) => (
  <div
    className={`flex flex-col gap-3 rounded-lg border border-rule bg-card p-4 sm:p-5 ${props.className ?? ''}`}
  >
    <Skeleton className="h-5 w-32" />
    {Array.from({ length: props.rows }, (_, row) => (
      <Skeleton key={row} className="h-9 w-full" />
    ))}
  </div>
);

/**
 * What shows while the dashboard loads: the header and the panels in their final places, as
 * skeletons, so nothing moves when the figures arrive. Only the dashboard has it: the other pages
 * of the workspace don't borrow its shape.
 * @returns The skeleton.
 */
export default function DashboardLoading() {
  const t = useTranslations('CrmDashboard');

  return (
    <output aria-busy="true" className="mx-auto flex max-w-6xl flex-col gap-6">
      <span className="sr-only">{t('loading')}</span>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-full sm:w-96" />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-5">
          {Array.from({ length: 5 }, (_, cell) => (
            <div
              key={cell}
              className="flex flex-col gap-2 bg-card px-4 py-3.5 last:max-sm:col-span-2"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-14" />
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Outline rows={5} />
          <Outline rows={4} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <Outline rows={3} />
          <Outline rows={3} />
          <Outline rows={4} className="lg:col-span-2 xl:col-span-1" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Outline rows={4} />
          <Outline rows={4} />
        </div>
      </div>
    </output>
  );
}
