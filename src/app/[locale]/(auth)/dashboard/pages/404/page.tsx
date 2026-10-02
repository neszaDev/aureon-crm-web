import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { ErrorPreviewSearch } from '@/components/showcase/pages/ErrorPreviewSearch';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

export default async function Error404Page(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Error404Page' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <section
        aria-labelledby="error-404-preview"
        className="flex justify-center rounded-sm border border-dashed border-ink-300 bg-paper px-4 py-12 sm:py-16"
      >
        {/* Same card as the app's not-found page, with the Vue page's search box. */}
        <div className="paper relative w-full max-w-lg px-6 pt-10 pb-8 sm:px-8">
          <p
            aria-hidden="true"
            className="absolute top-6 right-6 rotate-[-8deg] rounded-[50%] border-2 border-pen px-4 py-1 font-hand text-2xl font-bold text-pen sm:right-7"
          >
            {t('mark')}
          </p>
          <div className="flex flex-col gap-3 pr-24">
            <p className="tabular text-5xl leading-none font-extrabold tracking-[-0.035em] text-ink-950">
              {t('code')}
            </p>
            <h2
              id="error-404-preview"
              className="text-3xl font-extrabold tracking-[-0.03em] text-ink-950"
            >
              {t('card_title')}
            </h2>
          </div>
          <p className="mt-3 leading-relaxed text-ink-600">{t('card_text')}</p>
          <div className="mt-6">
            <ErrorPreviewSearch />
          </div>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/dashboard/">{t('home')}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
