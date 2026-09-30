import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/libs/I18nNavigation';

type IndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IndexPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Index' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Index(props: IndexPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Index' });

  return (
    <>
      <h2 className="mt-5 text-2xl font-bold">{t('title')}</h2>
      <p className="text-base">{t('intro')}</p>
      <ul className="mt-3 list-disc pl-6 text-base">
        <li>{t('feature_auth')}</li>
        <li>{t('feature_api')}</li>
        <li>{t('feature_i18n')}</li>
        <li>{t('feature_quality')}</li>
      </ul>
      <p className="text-base">
        <Link href="/sign-up/" className="font-bold text-blue-700 hover:underline">
          {t('cta')}
        </Link>
      </p>
    </>
  );
}
