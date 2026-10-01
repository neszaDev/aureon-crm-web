import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Placeholder for an app page while it loads: header band, totals, ruled rows.
 * @param props Component props.
 * @param props.rows Number of placeholder rows.
 * @returns The loading skeleton.
 */
export const LoadingCard = (props: { rows?: number }) => {
  const t = useTranslations('Loading');

  return (
    <output className="flex flex-col gap-8">
      <span className="sr-only">{t('label')}</span>
      <div className="flex flex-col gap-3 border-b-[3px] border-double border-ink-300 pb-6">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-[5.5rem] w-full rounded-sm" />
      <div className="flex flex-col rounded-sm border border-ink-200 bg-paper-card px-5 py-2 shadow-sheet">
        {Array.from({ length: props.rows ?? 5 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-ink-200 py-4 last:border-0"
          >
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="hidden h-4 w-32 sm:block" />
          </div>
        ))}
      </div>
    </output>
  );
};
