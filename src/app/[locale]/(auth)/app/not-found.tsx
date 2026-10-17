import { ArrowLeftIcon, SearchXIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PickerFrame } from '@/components/crm/shell/PickerFrame';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/libs/api/Queries';
import { Link } from '@/libs/I18nNavigation';

// Catches `notFound()` from the workspace layout: an unknown workspace, or one the user isn't a
// member of (the backend answers 404 for both, so ids can't be probed).
export default async function WorkspaceNotFoundPage() {
  const t = await getTranslations('CrmNotFound');
  const { user } = await getCurrentUser();

  return (
    <PickerFrame user={user}>
      <title>{t('meta_title')}</title>
      <div className="flex flex-col items-start gap-4 rounded-lg border border-rule bg-card p-6 shadow-sheet sm:p-8">
        <SearchXIcon aria-hidden="true" className="size-7 text-muted-foreground" />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('text')}</p>
        </div>
        <Button asChild>
          <Link href="/app">
            <ArrowLeftIcon data-icon="inline-start" />
            {t('back')}
          </Link>
        </Button>
      </div>
    </PickerFrame>
  );
}
