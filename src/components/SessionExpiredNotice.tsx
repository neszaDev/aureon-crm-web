'use client';

import { InfoIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

/**
 * Says why the user is back on sign-in after the backend ended their session (`?expired=1`).
 * Reads the query in the browser so the sign-in page stays static: render it in `<Suspense>`.
 * @returns The notice, or nothing.
 */
export const SessionExpiredNotice = () => {
  const t = useTranslations('SignInPage');
  const searchParams = useSearchParams();

  if (searchParams.get('expired') !== '1') {
    return null;
  }

  return (
    <output className="flex items-start gap-2.5 rounded-md border border-border bg-muted px-3.5 py-3 text-sm font-medium text-foreground">
      <InfoIcon aria-hidden="true" className="mt-px size-4 shrink-0" />
      {t('session_expired')}
    </output>
  );
};
