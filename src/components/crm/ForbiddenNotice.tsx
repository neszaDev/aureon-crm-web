import { ShieldAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Shown in place of a page or panel when the backend answers 403: the member's role doesn't
 * allow it.
 * @param props Component props.
 * @param props.page It replaces the whole page, so its title is the page's `h1`. That page's
 *   `generateMetadata` returns `ForbiddenNotice.title` as the document title too (a `<title>`
 *   rendered here would come after the metadata one, which the browser shows).
 * @returns The notice.
 */
export const ForbiddenNotice = (props: { page?: boolean }) => {
  const t = useTranslations('ForbiddenNotice');
  const Title = props.page ? 'h1' : 'p';

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rule bg-card p-5">
      <ShieldAlertIcon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-muted-foreground"
      />
      <div className="flex flex-col gap-1">
        <Title className="font-semibold">{t('title')}</Title>
        <p className="text-muted-foreground">{t('text')}</p>
      </div>
    </div>
  );
};
