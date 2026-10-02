import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import {
  BarChartExample,
  LineChartExample,
  PieChartExample,
  PolarAreaChartExample,
  RadarChartExample,
} from '@/components/showcase/charts/ChartExamples';
import { DemoCard } from '@/components/showcase/DemoCard';
import { SALES_POINTS } from '@/components/showcase/widgets/data';
import { Sparkline } from '@/components/showcase/widgets/Sparkline';
import { toneColor } from '@/components/showcase/widgets/tones';

export default async function ChartsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ChartsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DemoCard title={t('line_title')} description={t('line_description')}>
          <LineChartExample />
        </DemoCard>
        <DemoCard title={t('bar_title')} description={t('bar_description')}>
          <BarChartExample />
        </DemoCard>
        <DemoCard title={t('doughnut_title')} description={t('doughnut_description')}>
          <PieChartExample doughnut />
        </DemoCard>
        <DemoCard title={t('radar_title')} description={t('radar_description')}>
          <RadarChartExample />
        </DemoCard>
        <DemoCard title={t('pie_title')} description={t('pie_description')}>
          <PieChartExample />
        </DemoCard>
        <DemoCard title={t('polar_title')} description={t('polar_description')}>
          <PolarAreaChartExample />
        </DemoCard>
        <DemoCard title={t('simple_line_title')} description={t('simple_line_description')}>
          <Sparkline
            data={SALES_POINTS}
            name={t('sales')}
            color={toneColor.pass}
            className="h-40"
          />
        </DemoCard>
        <DemoCard title={t('simple_pointed_title')} description={t('simple_pointed_description')}>
          <Sparkline
            data={SALES_POINTS}
            name={t('sales')}
            color={toneColor.slate}
            dotColor="var(--ply)"
            pointed
            className="h-40"
          />
        </DemoCard>
        <DemoCard title={t('simple_bar_title')} description={t('simple_bar_description')}>
          <Sparkline
            kind="bar"
            data={SALES_POINTS}
            name={t('sales')}
            color={toneColor.pencil}
            className="h-40"
          />
        </DemoCard>
      </div>
    </>
  );
}
