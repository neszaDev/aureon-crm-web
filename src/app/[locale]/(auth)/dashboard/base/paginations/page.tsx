import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { PagerDemos } from '@/components/showcase/base/PagerDemos';

export default async function PaginationsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PaginationsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <PagerDemos />
    </>
  );
}
