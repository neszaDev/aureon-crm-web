import { ArrowRightIcon } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { AppConfig } from '@/utils/AppConfig';

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

const LINK =
  'font-semibold text-violet-ink underline decoration-violet-ink/40 underline-offset-4 hover:decoration-violet-ink';
const CODE = 'rounded-[3.6px] bg-muted px-1 py-px font-mono text-[0.8125rem] text-foreground';

export async function generateMetadata(
  props: AboutPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'About' });
  // An openGraph of its own replaces the parent's: keep the landing page's image.
  const { openGraph } = await parent;

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    openGraph: {
      title: t('meta_title'),
      description: t('meta_description'),
      siteName: AppConfig.name,
      locale,
      type: 'website',
      images: openGraph?.images,
    },
  };
}

export default async function AboutPage(props: AboutPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'About' });
  const code = (chunks: React.ReactNode) => <code className={CODE}>{chunks}</code>;

  const inside = [
    { title: t('inside_crm_title'), text: t('inside_crm') },
    { title: t('inside_auth_title'), text: t('inside_auth') },
    { title: t('inside_api_title'), text: t('inside_api') },
    { title: t('inside_ui_title'), text: t('inside_ui') },
    { title: t('inside_i18n_title'), text: t('inside_i18n') },
    { title: t('inside_quality_title'), text: t('inside_quality') },
  ];

  return (
    <article className="mx-auto flex max-w-[48rem] flex-col gap-12 px-4 py-14 sm:px-7 lg:py-20">
      <header className="flex flex-col gap-5">
        <h1 className="text-[2.5rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance lg:text-[2.75rem] [:lang(th)_&]:leading-[1.35]">
          {t('title')}
        </h1>
        <p className="max-w-[62ch] text-xl leading-relaxed">{t('lede')}</p>
        <p className="max-w-[62ch] text-lg leading-relaxed text-ink-2">
          {t.rich('backend', {
            api: (chunks) => (
              <a className={LINK} href={AppConfig.apiSourceUrl}>
                {chunks}
              </a>
            ),
          })}
        </p>
        <p className="max-w-[62ch] text-lg leading-relaxed text-ink-2">
          {t.rich('replace', { code })}
        </p>
      </header>

      <section aria-labelledby="inside-title" className="rounded-lg border border-rule bg-card">
        <h2 id="inside-title" className="border-b border-rule px-5 py-4 font-semibold">
          {t('inside_title')}
        </h2>
        <dl className="divide-y divide-rule">
          {inside.map((item) => (
            <div
              key={item.title}
              className="grid gap-x-6 gap-y-1 px-5 py-4 sm:grid-cols-[9rem_minmax(0,1fr)]"
            >
              <dt className="font-semibold">{item.title}</dt>
              <dd className="text-ink-2">{item.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="flex flex-col items-start gap-5 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[52ch] text-ink-2">
          {t.rich('credits', {
            boilerplate: (chunks) => (
              <a className={LINK} href="https://github.com/neszaDev/nextjs-boilerplate">
                {chunks}
              </a>
            ),
            upstream: (chunks) => (
              <a className={LINK} href="https://github.com/ixartz/Next-js-Boilerplate">
                {chunks}
              </a>
            ),
          })}
        </p>
        <Button asChild variant="outline" className="shrink-0">
          <a href={AppConfig.sourceUrl}>
            {t('code_link')}
            <ArrowRightIcon data-icon="inline-end" />
          </a>
        </Button>
      </footer>
    </article>
  );
}
