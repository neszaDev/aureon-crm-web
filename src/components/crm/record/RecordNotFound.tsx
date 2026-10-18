import { ArrowLeftIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * Shown in place of a record page, inside the shell, when the record doesn't exist (404, or a
 * malformed id): deleted, from another workspace, or a wrong link. The page's metadata uses the
 * same title.
 * @param props Component props.
 * @param props.href The record's list.
 * @param props.backLabel The link's label, such as "Back to companies".
 * @returns The panel.
 */
export const RecordNotFound = (props: { href: string; backLabel: string }) => {
  const t = useTranslations('RecordNotFound');

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <section className="flex flex-col items-start gap-4 rounded-lg border border-rule bg-card p-5 sm:p-6">
        <SearchXIcon aria-hidden="true" className="size-6 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-[-0.01em]">{t('title')}</h1>
          <p className="max-w-[65ch] text-muted-foreground">{t('text')}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={props.href}>
            <ArrowLeftIcon data-icon="inline-start" />
            {props.backLabel}
          </Link>
        </Button>
      </section>
    </div>
  );
};
