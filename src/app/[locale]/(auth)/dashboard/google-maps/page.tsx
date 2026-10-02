import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { GoogleMapDemo } from '@/components/showcase/maps/GoogleMapDemo';
import { Env } from '@/libs/Env';

export default async function GoogleMapsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'GoogleMapsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <DemoCard title={t('card_title')} description={t('card_description')}>
        <GoogleMapDemo apiKey={Env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} />
      </DemoCard>
    </>
  );
}
