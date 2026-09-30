import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: AboutPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'About' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function About(props: AboutPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'About' });

  return (
    <>
      <p>{t('about_paragraph')}</p>
      <p className="text-base">
        {t.rich('credits', {
          upstream: (chunks) => (
            <a
              className="text-blue-700 hover:border-b-2 hover:border-blue-700"
              href="https://github.com/ixartz/Next-js-Boilerplate"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </>
  );
}
