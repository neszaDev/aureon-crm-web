import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

// A panel's outline: a hairline box with its heading and a few rows, as the home's.
const Outline = (props: { rows: number }) => (
  <div className="flex flex-col gap-3 rounded-lg border border-rule bg-card p-4 sm:p-5">
    <Skeleton className="h-5 w-32" />
    {Array.from({ length: props.rows }, (_, row) => (
      <Skeleton key={row} className="h-9 w-full" />
    ))}
  </div>
);

/**
 * What shows while the home loads: the greeting and the panels in their final places, as
 * skeletons, so nothing moves when they arrive.
 * @returns The skeleton.
 */
export default function HomeLoading() {
  const t = useTranslations('CrmHome');

  return (
    <output aria-busy="true" className="mx-auto flex max-w-6xl flex-col gap-5">
      <span className="sr-only">{t('loading')}</span>
      <div aria-hidden="true" className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-5 w-56 max-w-full" />
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <Outline rows={5} />
            <Outline rows={3} />
          </div>
          <Outline rows={6} />
        </div>
      </div>
    </output>
  );
}
