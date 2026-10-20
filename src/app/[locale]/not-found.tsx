import { ArrowLeftIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PublicFrame } from '@/components/PublicFrame';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

// The public pages' not-found: their vermilion bar, and one card on the ground (as the app's).
export default function NotFoundPage() {
  const t = useTranslations('NotFound');

  return (
    <PublicFrame>
      <title>{t('meta_title')}</title>
      <div className="flex w-full max-w-lg flex-col items-start gap-6 rounded-lg border border-rule bg-card p-6 shadow-sheet sm:p-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl leading-[1.2] font-extrabold tracking-[-0.03em]">{t('title')}</h1>
          <p className="max-w-[65ch] text-muted-foreground">{t('text')}</p>
        </div>
        <Button asChild>
          <Link href="/">
            <ArrowLeftIcon data-icon="inline-start" />
            {t('home')}
          </Link>
        </Button>
      </div>
    </PublicFrame>
  );
}
