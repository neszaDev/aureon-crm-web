'use client';

import { ArrowLeftIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { CrmState } from '@/components/crm/CrmState';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * A path in the workspace that is no page: said so in the shell, with the way back to the
 * workspace's home.
 * @returns The notice.
 */
export default function WorkspacePageNotFound() {
  const t = useTranslations('NotFound');
  const params = useParams<{ workspaceId: string }>();

  return (
    <CrmState
      icon={SearchXIcon}
      heading
      title={t('title')}
      text={t('text')}
      className="mx-auto w-full max-w-lg py-8"
    >
      <title>{t('meta_title')}</title>
      <Button asChild>
        <Link href={`/app/${params.workspaceId}`}>
          <ArrowLeftIcon data-icon="inline-start" />
          {t('home')}
        </Link>
      </Button>
    </CrmState>
  );
}
