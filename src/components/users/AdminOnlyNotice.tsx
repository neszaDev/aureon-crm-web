import { ShieldAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Shown instead of user management to anyone without the admin role.
 * @returns The notice.
 */
export const AdminOnlyNotice = () => {
  const t = useTranslations('UsersPage');

  return (
    <Card className="max-w-2xl">
      <CardContent className="flex items-start gap-3">
        <ShieldAlertIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-600" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-ink-950">{t('admin_only_title')}</p>
          <p className="text-[0.9375rem] text-ink-600">{t('admin_only_text')}</p>
        </div>
      </CardContent>
    </Card>
  );
};
