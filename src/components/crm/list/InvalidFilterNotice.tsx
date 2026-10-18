import { TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

/**
 * Shown in place of a list when the backend refuses its query (400): filters that can't go
 * together, from a hand-edited or outdated link. It offers the list without them.
 * @param props Component props.
 * @param props.resetHref The list without search, filters or sort.
 * @returns The notice.
 */
export const InvalidFilterNotice = (props: { resetHref: string }) => {
  const t = useTranslations('RecordList');

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rule bg-card p-5">
      <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">{t('invalid_title')}</h2>
        <p className="text-muted-foreground">{t('invalid_text')}</p>
        <Link href={props.resetHref} className="mt-1 w-fit font-medium text-seal-ink">
          {t('invalid_reset')}
        </Link>
      </div>
    </div>
  );
};
