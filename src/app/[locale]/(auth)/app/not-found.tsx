import { ArrowLeftIcon, SearchXIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { CrmState } from '@/components/crm/CrmState';
import { PickerFrame } from '@/components/crm/shell/PickerFrame';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/libs/api/Queries';
import { Link } from '@/libs/I18nNavigation';

// Catches `notFound()` from the workspace layout, and from a page's `getOpenWorkspace` on a
// client navigation: an unknown workspace, or one the user isn't (or is no longer) a member of
// (the backend answers 404 for both, so ids can't be probed). It means "workspace gone" only.
export default async function WorkspaceNotFoundPage() {
  const t = await getTranslations('CrmNotFound');
  const { user } = await getCurrentUser();

  return (
    <PickerFrame user={user}>
      <title>{t('meta_title')}</title>
      <CrmState icon={SearchXIcon} heading title={t('title')} text={t('text')}>
        <Button asChild>
          <Link href="/app">
            <ArrowLeftIcon data-icon="inline-start" />
            {t('back')}
          </Link>
        </Button>
      </CrmState>
    </PickerFrame>
  );
}
