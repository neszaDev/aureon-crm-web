import { cn } from 'cn';
import { LightbulbIcon, SettingsIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoRow } from '@/components/showcase/buttons/DemoRow';
import { LoadingButtonDemo } from '@/components/showcase/buttons/LoadingButtonDemo';
import { TogglePressedDemo } from '@/components/showcase/buttons/TogglePressedDemo';
import {
  BOXED_VARIANTS,
  CARD_VARIANTS,
  PRESSED_CLASS,
} from '@/components/showcase/buttons/variants';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Button } from '@/components/ui/button';

const STATES = ['normal', 'active', 'disabled'] as const;
const SIZES = ['xs', 'sm', 'default', 'lg'] as const;

/**
 * Props a button gets in a state row: the pressed look for "active", disabled for "disabled".
 * @param state The row's state.
 * @param variant The button's variant.
 * @returns Props to spread on the button.
 */
const stateProps = (state: (typeof STATES)[number], variant: keyof typeof PRESSED_CLASS) => ({
  disabled: state === 'disabled',
  'aria-pressed': state === 'active' ? true : undefined,
  className: state === 'active' ? PRESSED_CLASS[variant] : undefined,
});

const code = (chunks: React.ReactNode) => <code className="font-mono text-ink-950">{chunks}</code>;

export default async function StandardButtonsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'StandardButtonsPage' });
  const tVariant = await getTranslations({ locale, namespace: 'ButtonVariants' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('standard_title')} description={t('standard_description')}>
        {STATES.map((state) => (
          <DemoRow key={state} label={t(`state_${state}`)}>
            {CARD_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant} {...stateProps(state, variant)}>
                {tVariant(variant)}
              </Button>
            ))}
          </DemoRow>
        ))}
        <DemoRow label={t('state_folder')} className="rounded-sm bg-folder p-4">
          <Button variant="inverse">{tVariant('inverse')}</Button>
          <Button variant="inverse-ghost">{tVariant('inverse_ghost')}</Button>
          <Button variant="inverse" disabled>
            {tVariant('inverse')}
          </Button>
        </DemoRow>
      </DemoCard>

      {(['outline', 'ghost'] as const).map((variant) => (
        <DemoCard
          key={variant}
          title={t(`${variant}_title`)}
          description={t.rich(`${variant}_description`, { code })}
        >
          {STATES.map((state) => (
            <DemoRow key={state} label={t(`state_${state}`)}>
              {SIZES.map((size) => (
                <Button key={size} variant={variant} size={size} {...stateProps(state, variant)}>
                  {t(`size_${size}`)}
                </Button>
              ))}
            </DemoRow>
          ))}
        </DemoCard>
      ))}

      {(['square', 'pill'] as const).map((shape) => (
        <DemoCard
          key={shape}
          title={t(`${shape}_title`)}
          description={t.rich(`${shape}_description`, { code })}
        >
          {STATES.map((state) => {
            const shapeClass = shape === 'square' ? 'rounded-none' : 'rounded-full';
            return (
              <DemoRow key={state} label={t(`state_${state}`)}>
                {BOXED_VARIANTS.map((variant) => {
                  const base = stateProps(state, variant);
                  return (
                    <Button
                      key={variant}
                      variant={variant}
                      {...base}
                      className={cn(shapeClass, base.className)}
                    >
                      {tVariant(variant)}
                    </Button>
                  );
                })}
              </DemoRow>
            );
          })}
        </DemoCard>
      ))}

      <DemoCard title={t('sizes_title')} description={t('sizes_description')}>
        {SIZES.map((size) => (
          <DemoRow key={size} label={t(`size_${size}`)}>
            <Button size={size}>{t('standard_button')}</Button>
            <Button size={size} variant="outline">
              {t('outline_button')}
            </Button>
            <Button size={size} variant="ghost">
              {t('ghost_button')}
            </Button>
            <Button size={size} variant="secondary" className="rounded-none">
              {t('square_button')}
            </Button>
            <Button size={size} variant="destructive" className="rounded-full">
              {t('pill_button')}
            </Button>
          </DemoRow>
        ))}
      </DemoCard>

      <DemoCard title={t('icons_title')} description={t('icons_description')}>
        <DemoRow label={t('icons_leading')}>
          <Button>
            <LightbulbIcon data-icon="inline-start" />
            {t('standard_button')}
          </Button>
          <Button variant="outline">
            <LightbulbIcon data-icon="inline-start" />
            {t('outline_button')}
          </Button>
          <Button variant="ghost">
            <LightbulbIcon data-icon="inline-start" />
            {t('ghost_button')}
          </Button>
          <Button variant="secondary" className="rounded-none">
            <LightbulbIcon data-icon="inline-start" />
            {t('square_button')}
          </Button>
          <Button variant="destructive" className="rounded-full">
            <LightbulbIcon data-icon="inline-start" />
            {t('pill_button')}
          </Button>
        </DemoRow>
        <DemoRow label={t('icons_only')}>
          {(['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const).map((size) => (
            <Button key={size} size={size} variant="outline" aria-label={t('settings')}>
              <SettingsIcon />
            </Button>
          ))}
        </DemoRow>
        <DemoRow label={t('icons_loading')}>
          <LoadingButtonDemo />
        </DemoRow>
      </DemoCard>

      <DemoCard title={t('toggle_title')} description={t('toggle_description')}>
        <TogglePressedDemo />
      </DemoCard>

      <div className="grid gap-8 md:grid-cols-2">
        <DemoCard
          title={t('block_title')}
          description={t.rich('block_description', { code })}
          contentClassName="flex flex-col gap-2"
        >
          {(['secondary', 'default', 'destructive', 'link'] as const).map((variant) => (
            <Button key={variant} size="lg" variant={variant} className="w-full">
              {t('block_button')}
            </Button>
          ))}
        </DemoCard>
        <DemoCard
          title={t('block_outline_title')}
          description={t.rich('block_description', { code })}
          contentClassName="flex flex-col gap-2"
        >
          {(['outline', 'ghost'] as const).map((variant) => (
            <Button key={variant} size="lg" variant={variant} className="w-full">
              {t('block_button')}
            </Button>
          ))}
        </DemoCard>
      </div>
    </>
  );
}
