import { getTranslations, setRequestLocale } from 'next-intl/server';
import { QrCodeCard } from '@/components/campus/QrCodeCard';
import { PageHeader } from '@/components/PageHeader';

export default async function CampusQrCodePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CampusQrCodePage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="max-w-md">
        <QrCodeCard />
      </div>
    </>
  );
}
