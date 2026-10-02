import { ExternalLinkIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { GrowSpinner, SPINKIT_LOADERS, SpinKit } from '@/components/showcase/plugins/SpinKit';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default async function SpinnersPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SpinnersPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('base_title')} description={t('base_description')}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Spinner label={t('loading')} className="text-folder motion-reduce:animate-none" />
          <Spinner
            label={t('loading')}
            className="size-8 text-ink-700 motion-reduce:animate-none"
          />
          <Spinner
            label={t('loading')}
            className="size-16 text-ink-950 motion-reduce:animate-none"
          />
          <GrowSpinner label={t('loading')} className="size-4 text-ink-600" />
          <GrowSpinner label={t('loading')} className="size-8 text-folder" />
          <GrowSpinner label={t('loading')} className="size-16 text-ink-950" />
        </div>
      </DemoCard>

      <DemoCard
        title={t('spinkit_title')}
        action={
          <Button asChild variant="link" size="sm">
            <a
              href="https://github.com/tobiasahlin/SpinKit"
              target="_blank"
              rel="noreferrer noopener"
            >
              {t('docs')}
              <ExternalLinkIcon data-icon="inline-end" />
            </a>
          </Button>
        }
      >
        <p className="max-w-prose text-[0.9375rem] leading-relaxed text-ink-700">
          {t('spinkit_text')}
        </p>
      </DemoCard>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SPINKIT_LOADERS.map((loader) => (
          <li key={loader} className="list-none">
            <DemoCard
              title={t(`loader_${loader}`)}
              contentClassName="flex h-32 items-center justify-center pt-5"
            >
              <SpinKit loader={loader} />
            </DemoCard>
          </li>
        ))}
      </ul>
    </>
  );
}
