import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

// A panel's outline: a hairline box with its heading and a few rows, as the dashboard's.
const Outline = (props: { rows: number }) => (
  <div className="flex flex-col gap-3 rounded-lg border border-rule bg-card p-4 sm:p-5">
    <Skeleton className="h-5 w-32" />
    {Array.from({ length: props.rows }, (_, row) => (
      <Skeleton key={row} className="h-9 w-full" />
    ))}
  </div>
);

/**
 * What shows while the dashboard loads: the title, the line of figures and the panels in their
 * final places, as skeletons, so nothing moves when the figures arrive.
 * @returns The skeleton.
 */
export default function DashboardLoading() {
  const t = useTranslations('CrmDashboard');

  return (
    <output aria-busy="true" className="mx-auto flex max-w-6xl flex-col gap-5">
      <span className="sr-only">{t('loading')}</span>
      <div aria-hidden="true" className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-8 w-full max-w-3xl" />
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Outline rows={5} />
          <div className="flex flex-col gap-5">
            <Outline rows={2} />
            <Outline rows={3} />
          </div>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Outline rows={4} />
          <Outline rows={4} />
        </div>
      </div>
    </output>
  );
}
