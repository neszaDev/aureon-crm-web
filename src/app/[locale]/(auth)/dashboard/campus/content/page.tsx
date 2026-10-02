import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContentEditors } from '@/components/campus/ContentEditors';
import { PageHeader } from '@/components/PageHeader';

export default async function CampusContentPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CampusContentPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <ContentEditors />
    </>
  );
}
