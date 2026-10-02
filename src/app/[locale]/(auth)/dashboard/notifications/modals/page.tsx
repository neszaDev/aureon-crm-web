import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { ModalsDemo } from '@/components/showcase/notifications/ModalsDemo';

export default async function ModalsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ModalsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('card_title')} description={t('card_description')}>
        <ModalsDemo />
      </DemoCard>
    </>
  );
}
