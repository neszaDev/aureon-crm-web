import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/Wordmark';
import { Link } from '@/libs/I18nNavigation';

export default function NotFoundPage() {
  const t = useTranslations('NotFound');

  return (
    <div className="flex min-h-dvh flex-col">
      <title>{t('meta_title')}</title>
      <header className="flex h-16 items-center bg-folder px-4 sm:px-8">
        <Wordmark tone="folder" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="paper relative w-full max-w-lg px-8 pt-10 pb-8">
          <p
            aria-hidden="true"
            className="absolute top-6 right-7 rotate-[-8deg] rounded-[50%] border-2 border-pen px-4 py-1 font-hand text-2xl font-bold text-pen"
          >
            {t('mark')}
          </p>
          <div className="flex flex-col gap-3 pr-24">
            <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink-950">
              {t('title')}
            </h1>
            <p className="leading-relaxed text-ink-600">{t('text')}</p>
          </div>
          <Button asChild className="mt-8">
            <Link href="/">{t('home')}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
