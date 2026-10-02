import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { ComposeForm } from '@/components/showcase/apps/email/ComposeForm';

type ComposePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ to?: string; subject?: string }>;
};

export default async function ComposePage(props: ComposePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ComposePage' });
  const searchParams = await props.searchParams;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      {/* A reply or a forward opens the form prefilled. */}
      <ComposeForm
        key={`${searchParams.to ?? ''}|${searchParams.subject ?? ''}`}
        defaultTo={searchParams.to}
        defaultSubject={searchParams.subject}
      />
    </>
  );
}
