'use client';

import { ArrowLeftIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
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
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 py-8">
      <title>{t('meta_title')}</title>
      <SearchXIcon aria-hidden="true" className="size-7 text-muted-foreground" />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.25rem] leading-7 font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('text')}</p>
      </div>
      <Button asChild>
        <Link href={`/app/${params.workspaceId}`}>
          <ArrowLeftIcon data-icon="inline-start" />
          {t('home')}
        </Link>
      </Button>
    </div>
  );
}
