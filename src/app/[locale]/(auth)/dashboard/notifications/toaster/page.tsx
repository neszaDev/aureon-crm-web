import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { ToasterDemo } from '@/components/showcase/notifications/ToasterDemo';

export default async function ToasterPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ToasterPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('card_title')} description={t('card_description')}>
        <ToasterDemo />
      </DemoCard>
    </>
  );
}
