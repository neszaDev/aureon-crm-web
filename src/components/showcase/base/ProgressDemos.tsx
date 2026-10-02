'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Button } from '@/components/ui/button';
import { Meter } from './Meter';
import type { Tone } from './tones';

/**
 * The first Vue progress card: an animated bar and a stacked bar that both follow one counter,
 * and a button that sets the counter to a random value.
 * @returns The card.
 */
export const CounterProgress = () => {
  const t = useTranslations('ProgressBarsPage');
  const [counter, setCounter] = useState(73);

  return (
    <DemoCard title={t('counter_title')} description={t('counter_description')}>
      <div className="flex flex-col gap-2">
        <Meter
          label={t('counter_title')}
          segments={[{ value: counter, label: 'percentage', animated: true }]}
        />
        <Meter
          label={t('counter_stacked')}
          segments={[
            { value: counter * 0.6, tone: 'pass', label: 'value' },
            { value: counter * 0.25, tone: 'pencil', label: 'value' },
            { value: counter * 0.15, tone: 'pen', label: 'value' },
          ]}
        />
      </div>
      <Button
        variant="secondary"
        className="mt-5"
        onClick={() => {
          setCounter(Math.random() * 100);
        }}
      >
        {t('counter_button')}
      </Button>
    </DemoCard>
  );
};

const COLOR_TONES: Tone[] = ['pass', 'deep', 'pencil', 'pen', 'folder', 'ink', 'dark'];

/**
 * Bars in every tone; their values change every two seconds, as in the Vue demo.
 * @returns The card.
 */
export const ColorProgress = () => {
  const t = useTranslations('ProgressBarsPage');
  const tTone = useTranslations('BaseTones');
  const [values, setValues] = useState(() => COLOR_TONES.map(() => 75));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setValues(COLOR_TONES.map(() => 25 + Math.random() * 75));
    }, 2000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <DemoCard title={t('colors_title')} description={t('colors_description')}>
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
        {COLOR_TONES.map((tone, index) => (
          <div key={tone} className="contents">
            <dt className="text-sm text-ink-700">{tTone(tone)}</dt>
            <dd className="mb-2 sm:mb-0">
              <Meter label={tTone(tone)} segments={[{ value: values[index] ?? 0, tone }]} />
            </dd>
          </div>
        ))}
      </dl>
    </DemoCard>
  );
};

const STRIPED: { value: number; tone: Tone }[] = [
  { value: 25, tone: 'pass' },
  { value: 50, tone: 'deep' },
  { value: 75, tone: 'pencil' },
  { value: 100, tone: 'pen' },
];

/**
 * Four bars with stripes that a button adds or removes.
 * @returns The card.
 */
export const StripedProgress = () => {
  const t = useTranslations('ProgressBarsPage');
  const [striped, setStriped] = useState(true);

  return (
    <DemoCard title={t('striped_title')}>
      <div className="flex flex-col gap-2">
        {STRIPED.map((bar) => (
          <Meter
            key={bar.tone}
            label={t('bar_label', { value: bar.value })}
            segments={[{ ...bar, striped }]}
          />
        ))}
      </div>
      <Button
        variant="secondary"
        className="mt-5"
        aria-pressed={striped}
        onClick={() => {
          setStriped(!striped);
        }}
      >
        {striped ? t('striped_remove') : t('striped_add')}
      </Button>
    </DemoCard>
  );
};

/**
 * Four striped bars whose stripes move until a button stops them.
 * @returns The card.
 */
export const AnimatedProgress = () => {
  const t = useTranslations('ProgressBarsPage');
  const [animated, setAnimated] = useState(true);

  return (
    <DemoCard title={t('animated_title')} description={t('animated_description')}>
      <div className="flex flex-col gap-2">
        {STRIPED.map((bar) => (
          <Meter
            key={bar.tone}
            label={t('bar_label', { value: bar.value })}
            segments={[{ ...bar, striped: true, animated }]}
          />
        ))}
      </div>
      <Button
        variant="secondary"
        className="mt-5"
        aria-pressed={animated}
        onClick={() => {
          setAnimated(!animated);
        }}
      >
        {animated ? t('animated_stop') : t('animated_start')}
      </Button>
    </DemoCard>
  );
};
