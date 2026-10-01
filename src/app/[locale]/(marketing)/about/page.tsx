import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mark } from '@/components/report/Mark';

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

export default async function AboutPage(props: AboutPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'About' });

  const inside = [
    t('feature_auth'),
    t('feature_api'),
    t('feature_ui'),
    t('feature_i18n'),
    t('feature_quality'),
  ];

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
      <header className="flex flex-col gap-6 border-b-[3px] border-double border-ink-300 pb-10">
        <h1 className="text-4xl font-extrabold tracking-[-0.03em] text-ink-950 sm:text-5xl">
          {t('title')}
        </h1>
        <p className="max-w-[62ch] text-xl leading-relaxed text-ink-700">{t('about_paragraph')}</p>
        <p className="max-w-[62ch] text-lg leading-relaxed text-ink-600">
          {t('replace_paragraph')}
        </p>
      </header>

      <section aria-labelledby="inside-heading" className="flex flex-col gap-6">
        <h2 id="inside-heading" className="text-2xl font-bold tracking-[-0.02em] text-ink-950">
          {t('inside_title')}
        </h2>
        <ul className="divide-y divide-ink-200 border-y border-ink-300">
          {inside.map((item) => (
            <li key={item} className="flex items-start gap-4 py-4 text-[1.0625rem] leading-relaxed">
              <Mark status="PASSED" className="mt-0.5 size-6" />
              <span className="text-ink-900">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-base text-ink-600">
        {t.rich('credits', {
          upstream: (chunks) => (
            <a
              className="font-semibold text-folder underline decoration-folder/40 underline-offset-4 hover:decoration-folder"
              href="https://github.com/ixartz/Next-js-Boilerplate"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </article>
  );
}
