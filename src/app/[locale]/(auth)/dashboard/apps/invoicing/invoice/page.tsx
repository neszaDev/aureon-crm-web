import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { InvoiceView } from '@/components/showcase/apps/invoice/InvoiceView';

export default async function InvoicePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'InvoicePage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <InvoiceView />
    </>
  );
}
