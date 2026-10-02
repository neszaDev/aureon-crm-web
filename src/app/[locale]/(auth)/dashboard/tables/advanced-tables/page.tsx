import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { BackendTable } from '@/components/showcase/tables/BackendTable';
import { DemoTable } from '@/components/showcase/tables/DemoTable';
import { DownloadTable } from '@/components/showcase/tables/DownloadTable';
import { SelectTable } from '@/components/showcase/tables/SelectTable';

export default async function AdvancedTablesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdvancedTablesPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('demo_title')} description={t('demo_description')}>
        <DemoTable />
      </DemoCard>
      <DemoCard title={t('backend_title')} description={t('backend_description')}>
        <BackendTable />
      </DemoCard>
      <DemoCard title={t('download_title')} description={t('download_description')}>
        <DownloadTable />
      </DemoCard>
      <DemoCard title={t('select_title')} description={t('select_description')}>
        <SelectTable />
      </DemoCard>
    </>
  );
}
