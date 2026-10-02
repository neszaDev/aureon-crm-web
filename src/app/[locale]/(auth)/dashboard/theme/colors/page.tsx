import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { ColorTheme } from '@/components/showcase/theme/ColorTheme';
import { INK_RAMP, THEME_COLORS } from '@/components/showcase/theme/palette';

const GRID = 'grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

export default async function ColorsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ColorsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard title={t('theme_title')} description={t('theme_description')}>
        <ul className={GRID}>
          {THEME_COLORS.map((swatch) => (
            <ColorTheme key={swatch.token} swatch={swatch} role={t(`role_${swatch.token}`)} />
          ))}
        </ul>
      </DemoCard>

      <DemoCard title={t('ink_title')} description={t('ink_description')}>
        <ul className={GRID}>
          {INK_RAMP.map((swatch) => (
            <ColorTheme key={swatch.token} swatch={swatch} role={t(`role_${swatch.token}`)} />
          ))}
        </ul>
      </DemoCard>
    </>
  );
}
