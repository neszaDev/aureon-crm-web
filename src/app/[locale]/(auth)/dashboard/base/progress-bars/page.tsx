import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import type { MeterSegment } from '@/components/showcase/base/Meter';
import { Meter } from '@/components/showcase/base/Meter';
import {
  AnimatedProgress,
  ColorProgress,
  CounterProgress,
  StripedProgress,
} from '@/components/showcase/base/ProgressDemos';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Progress } from '@/components/ui/progress';

// The Vue labels demo: a third of a track whose full value is 50.
const LABEL_VALUE = 33.333333333;
const LABEL_MAX = 50;
const VALUE = 75;
const STACK = [
  { value: 15, tone: 'folder' },
  { value: 30, tone: 'pass' },
  { value: 20, tone: 'deep' },
] as const;

// A track in the Marksheet look, on the ui primitive (for bars that print no label).
const TRACK = 'h-4 rounded-sm bg-ink-100';

/**
 * A caption above an example bar.
 * @param props Component props.
 * @param props.children Caption text.
 * @returns The caption.
 */
const Caption = (props: { children: React.ReactNode }) => (
  <h3 className="form-label mt-4 mb-2 first:mt-0">{props.children}</h3>
);

export default async function ProgressBarsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ProgressBarsPage' });

  const stack = (extra: Partial<MeterSegment>): MeterSegment[] =>
    STACK.map((segment) => ({ ...segment, ...extra }));

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <CounterProgress />

      <DemoCard title={t('labels_title')}>
        <Caption>{t('labels_none')}</Caption>
        <Progress
          value={(LABEL_VALUE / LABEL_MAX) * 100}
          aria-valuenow={Math.round((LABEL_VALUE / LABEL_MAX) * 100)}
          aria-label={t('labels_none')}
          className={TRACK}
        />
        <Caption>{t('labels_value')}</Caption>
        <Meter
          label={t('labels_value')}
          max={LABEL_MAX}
          segments={[{ value: LABEL_VALUE, label: 'value' }]}
        />
        <Caption>{t('labels_percentage')}</Caption>
        <Meter
          label={t('labels_percentage')}
          max={LABEL_MAX}
          segments={[{ value: LABEL_VALUE, label: 'percentage' }]}
        />
        <Caption>{t('labels_value_precision')}</Caption>
        <Meter
          label={t('labels_value_precision')}
          max={LABEL_MAX}
          precision={2}
          segments={[{ value: LABEL_VALUE, label: 'value' }]}
        />
        <Caption>{t('labels_percentage_precision')}</Caption>
        <Meter
          label={t('labels_percentage_precision')}
          max={LABEL_MAX}
          precision={2}
          segments={[{ value: LABEL_VALUE, label: 'percentage' }]}
        />
      </DemoCard>

      <DemoCard title={t('width_title')}>
        <Caption>{t('width_default')}</Caption>
        <Progress
          value={VALUE}
          aria-valuenow={VALUE}
          aria-label={t('width_default')}
          className={TRACK}
        />
        <Caption>{t('width_custom')}</Caption>
        <div className="flex flex-col gap-2">
          <Progress
            value={VALUE}
            aria-valuenow={VALUE}
            aria-label={t('width_three_quarters')}
            className={`${TRACK} w-3/4`}
          />
          <Progress
            value={VALUE}
            aria-valuenow={VALUE}
            aria-label={t('width_half')}
            className={`${TRACK} w-1/2`}
          />
          <Progress
            value={VALUE}
            aria-valuenow={VALUE}
            aria-label={t('width_quarter')}
            className={`${TRACK} w-1/4`}
          />
        </div>
      </DemoCard>

      <DemoCard title={t('height_title')}>
        <Caption>{t('height_default')}</Caption>
        <Meter label={t('height_default')} segments={[{ value: VALUE, label: 'percentage' }]} />
        <Caption>{t('height_custom')}</Caption>
        <div className="flex flex-col gap-2">
          <Meter
            label={t('height_large')}
            className="h-8"
            segments={[{ value: VALUE, label: 'percentage' }]}
          />
          <Meter
            label={t('height_medium')}
            className="h-5"
            segments={[{ value: VALUE, label: 'percentage' }]}
          />
          <Progress
            value={VALUE}
            aria-valuenow={VALUE}
            aria-label={t('height_thin')}
            className="h-0.5 rounded-sm bg-ink-100"
          />
        </div>
      </DemoCard>

      <ColorProgress />
      <StripedProgress />
      <AnimatedProgress />

      <DemoCard title={t('multiple_title')} description={t('multiple_description')}>
        <div className="flex flex-col gap-3">
          <Meter label={t('multiple_plain')} segments={stack({})} />
          <Meter label={t('multiple_percentage')} segments={stack({ label: 'percentage' })} />
          <Meter label={t('multiple_value')} segments={stack({ label: 'value', striped: true })} />
          <Meter
            label={t('multiple_mixed')}
            segments={[
              { ...STACK[0], label: 'percentage' },
              { ...STACK[1], label: 'percentage', animated: true },
              { ...STACK[2], label: 'percentage', striped: true },
            ]}
          />
        </div>
      </DemoCard>
    </>
  );
}
