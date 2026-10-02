import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { Mark } from '@/components/report/Mark';
import { ErrorPreviewSearch } from '@/components/showcase/pages/ErrorPreviewSearch';
import { RetryButton } from '@/components/showcase/pages/RetryButton';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

export default async function Error500Page(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Error500Page' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <section
        aria-labelledby="error-500-preview"
        className="flex justify-center rounded-sm border border-dashed border-ink-300 bg-paper px-4 py-12 sm:py-16"
      >
        {/* Same card as the app's error boundary, with the Vue page's code and search box. */}
        <div className="paper flex w-full max-w-lg flex-col items-start gap-5 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Mark status="FAILED" className="size-12" />
            <p className="tabular text-5xl leading-none font-extrabold tracking-[-0.035em] text-ink-950">
              {t('code')}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h2
              id="error-500-preview"
              className="text-2xl font-extrabold tracking-[-0.02em] text-ink-950"
            >
              {t('card_title')}
            </h2>
            <p className="leading-relaxed text-ink-600">{t('card_text')}</p>
          </div>
          <ErrorPreviewSearch />
          <div className="flex flex-wrap gap-3">
            <RetryButton>{t('retry')}</RetryButton>
            <Button asChild variant="outline">
              <Link href="/dashboard/">{t('home')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
