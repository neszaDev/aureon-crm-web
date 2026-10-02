import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { TrafficCard } from '@/components/showcase/analytics/TrafficCard';
import { TrafficSales } from '@/components/showcase/analytics/TrafficSales';
import { WidgetsBrand } from '@/components/showcase/widgets/WidgetsBrand';
import { WidgetsDropdown } from '@/components/showcase/widgets/WidgetsDropdown';

export default async function AnalyticsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AnalyticsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <WidgetsDropdown />
      <TrafficCard />
      <WidgetsBrand charts />
      <TrafficSales />
    </>
  );
}
