import { ArrowRightIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Mark } from '@/components/report/Mark';
import { SampleCard } from '@/components/report/SampleCard';
import { StatusMark } from '@/components/report/StatusMark';
import { Button } from '@/components/ui/button';
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

export default async function IndexPage(props: IndexPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Index' });
  const format = await getFormatter({ locale });

  const marks = [
    { status: 'PASSED', text: t('key_passed') },
    { status: 'FAILED', text: t('key_failed') },
    { status: 'PENDING', text: t('key_pending') },
  ] as const;

  // The first sample row, taken apart field by field.
  const fields = [
    {
      label: t('row_name'),
      value: <span className="font-bold">{t('sample_1_name')}</span>,
      description: t('row_name_desc'),
    },
    {
      label: t('row_status'),
      value: <StatusMark status="PASSED" className="[&_svg]:size-7" />,
      description: t('row_status_desc'),
    },
    {
      label: t('row_score'),
      value: <span className="text-3xl font-bold tabular-nums">{format.number(94)}</span>,
      description: t('row_score_desc'),
    },
    {
      label: t('row_tested_at'),
      value: (
        <time dateTime="2026-09-28T09:30">
          {format.dateTime(new Date('2026-09-28T09:30'), {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </time>
      ),
      description: t('row_tested_at_desc'),
    },
    {
      label: t('row_notes'),
      value: (
        <span className="font-hand text-xl leading-snug text-ink-700">{t('row_notes_sample')}</span>
      ),
      description: t('row_notes_desc'),
    },
  ];

  const features = [
    { title: t('feature_totals_title'), text: t('feature_totals') },
    { title: t('feature_history_title'), text: t('feature_history') },
    { title: t('feature_private_title'), text: t('feature_private') },
    { title: t('feature_languages_title'), text: t('feature_languages') },
  ];

  return (
    <>
      {/* The folder: copy on the left, the card sliding out of it on the right. */}
      <section className="bg-folder text-folder-ink">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-14 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pt-20">
          <div className="flex flex-col gap-7 lg:col-span-5 lg:pt-10 lg:pb-32">
            <h1 className="text-[2.75rem] leading-[1.02] font-extrabold tracking-[-0.035em] sm:text-6xl lg:text-[4.25rem]">
              {t('title')}
            </h1>
            <p className="max-w-[34ch] text-lg leading-relaxed text-folder-ink-soft">
              {t('intro')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="inverse" size="lg">
                <Link href="/sign-up/">
                  {t('cta')}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="inverse-ghost" size="lg">
                <Link href="/sign-in/">{t('secondary_cta')}</Link>
              </Button>
            </div>
          </div>

          <div className="relative lg:col-span-7 lg:pt-24 lg:pl-6">
            <div className="-mb-28 sm:-mb-36 lg:mb-[-11rem] lg:rotate-[-1.5deg]">
              <SampleCard />
            </div>
          </div>
        </div>
      </section>

      {/* Key to the marks, printed like the back of a report card. */}
      <section className="mx-auto max-w-7xl px-4 pt-44 pb-20 sm:px-6 sm:pt-52 lg:px-8 lg:pt-64 lg:pb-28">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <h2 className="text-3xl font-bold tracking-[-0.025em] text-ink-950 sm:text-4xl">
              {t('key_title')}
            </h2>
            <p className="max-w-[40ch] text-lg leading-relaxed text-ink-600">{t('key_intro')}</p>
          </div>
          <ul className="divide-y divide-ink-200 border-y-[3px] border-double border-ink-300 lg:col-span-7">
            {marks.map((mark) => (
              <li key={mark.status} className="flex items-center gap-6 py-6">
                <Mark status={mark.status} drawOnView className="size-12 sm:size-14" />
                <p className="text-lg font-medium text-ink-900 sm:text-xl">{mark.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* One row of the card, taken apart. */}
      <section className="border-y border-ink-200 bg-paper-card">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex max-w-2xl flex-col gap-4">
            <h2 className="text-3xl font-bold tracking-[-0.025em] text-ink-950 sm:text-4xl">
              {t('rows_title')}
            </h2>
            <p className="text-lg leading-relaxed text-ink-600">{t('rows_intro')}</p>
          </div>
          <dl className="mt-12 grid border-t-[3px] border-double border-ink-300 sm:grid-cols-2 lg:grid-cols-5">
            {fields.map((field) => (
              <div
                key={field.label}
                className="flex flex-col gap-3 border-b border-ink-200 py-6 sm:pr-6 lg:border-r lg:border-b-0 lg:px-5 lg:py-8 lg:first:pl-0 lg:last:border-r-0"
              >
                <dt className="form-label">{field.label}</dt>
                <dd className="flex min-h-12 items-center text-lg text-ink-950">{field.value}</dd>
                <dd className="text-[0.9375rem] leading-relaxed text-ink-600">
                  {field.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* What the product does, as a ruled two-column list. */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <h2 className="text-3xl font-bold tracking-[-0.025em] text-ink-950 sm:text-4xl lg:col-span-5">
            {t('features_title')}
          </h2>
          <dl className="divide-y divide-ink-200 border-y border-ink-300 lg:col-span-7">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="grid gap-2 py-6 sm:grid-cols-[13rem_1fr] sm:gap-6"
              >
                <dt className="font-bold text-ink-950">{feature.title}</dt>
                <dd className="leading-relaxed text-ink-700">{feature.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Close: back into the folder. */}
      <section className="bg-folder text-folder-ink">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-24">
          <div className="flex max-w-xl flex-col gap-4">
            <h2 className="flex items-center gap-4 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
              <Mark status="PASSED" className="size-12 text-folder-ink-soft sm:size-14" />
              {t('close_title')}
            </h2>
            <p className="text-lg leading-relaxed text-folder-ink-soft">{t('close_text')}</p>
          </div>
          <Button asChild variant="inverse" size="lg">
            <Link href="/sign-up/">
              {t('cta')}
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
