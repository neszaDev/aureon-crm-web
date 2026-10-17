import { ShieldAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Shown in place of a page or panel when the backend answers 403: the member's role doesn't
 * allow it.
 * @returns The notice.
 */
export const ForbiddenNotice = () => {
  const t = useTranslations('ForbiddenNotice');

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rule bg-card p-5">
      <ShieldAlertIcon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-muted-foreground"
      />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{t('title')}</p>
        <p className="text-muted-foreground">{t('text')}</p>
      </div>
    </div>
  );
};
