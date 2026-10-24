import { ArrowLeftIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CrmState } from '@/components/crm/CrmState';
import { PUBLIC_CARD, PublicFrame } from '@/components/PublicFrame';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

// The public pages' not-found: the wordmark over the canvas, and one card (the app's states).
export default function NotFoundPage() {
  const t = useTranslations('NotFound');

  return (
    <PublicFrame>
      <title>{t('meta_title')}</title>
      <CrmState
        icon={SearchXIcon}
        heading
        title={t('title')}
        text={t('text')}
        className={PUBLIC_CARD}
      >
        <Button asChild>
          <Link href="/">
            <ArrowLeftIcon data-icon="inline-start" />
            {t('home')}
          </Link>
        </Button>
      </CrmState>
    </PublicFrame>
  );
}
