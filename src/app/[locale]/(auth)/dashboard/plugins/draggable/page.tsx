import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DraggableGrid } from '@/components/showcase/plugins/DraggableGrid';

export default async function DraggablePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'DraggablePage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <DraggableGrid />
    </>
  );
}
