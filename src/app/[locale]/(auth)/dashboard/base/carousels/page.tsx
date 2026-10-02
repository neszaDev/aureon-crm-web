import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { PageHeader } from '@/components/PageHeader';
import { DemoCarousel } from '@/components/showcase/base/DemoCarousel';
import { DemoCard } from '@/components/showcase/DemoCard';

export default async function CarouselsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CarouselsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('card_title')} description={t('card_description')} className="lg:w-7/12">
        <DemoCarousel
          picture={
            <Image
              src="/assets/images/mfu-logo.svg"
              alt={t('slide_logo_alt')}
              width={400}
              height={673}
              className="h-4/5 w-auto"
            />
          }
        />
      </DemoCard>
    </>
  );
}
