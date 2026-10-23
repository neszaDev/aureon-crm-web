import { ShieldAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CrmState } from '@/components/crm/CrmState';

/**
 * Shown in place of a page or a part of one when the backend answers 403: the member's role doesn't
 * allow it. In place of a page it is a `CrmState`; in a part of one, a line with its icon.
 * @param props Component props.
 * @param props.page It replaces the whole page, so its title is the page's `h1`. That page's
 *   `generateMetadata` returns `ForbiddenNotice.title` as the document title too (a `<title>`
 *   rendered here would come after the metadata one, which the browser shows).
 * @returns The notice.
 */
export const ForbiddenNotice = (props: { page?: boolean }) => {
  const t = useTranslations('ForbiddenNotice');

  if (props.page) {
    return (
      <CrmState
        icon={ShieldAlertIcon}
        heading
        title={t('title')}
        text={t('text')}
        className="mx-auto w-full max-w-6xl py-6"
      />
    );
  }

  return (
    <div className="flex items-start gap-3 py-1">
      <ShieldAlertIcon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div className="flex flex-col gap-0.5 text-sm">
        <p className="font-semibold">{t('title')}</p>
        <p className="text-muted-foreground">{t('text')}</p>
      </div>
    </div>
  );
};
