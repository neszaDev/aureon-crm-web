import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { BRANDS } from '@/components/showcase/buttons/brands';
import { DemoRow } from '@/components/showcase/buttons/DemoRow';
import { DemoCard } from '@/components/showcase/DemoCard';
import { CoreuiIcon } from '@/components/showcase/icons/CoreuiIcon';
import { Button } from '@/components/ui/button';

const SIZES = ['sm', 'default', 'lg'] as const;
const ICON_SIZES = { sm: 'icon-sm', default: 'icon', lg: 'icon-lg' } as const;
const ICON_CLASS = { sm: 'size-3.5', default: 'size-4', lg: 'size-5' } as const;

// Code samples are code, not copy: they stay the same in every language.
const USAGE = {
  both: '<Button variant="outline"><CoreuiIcon icon={cibFacebook} name="facebook" />Facebook</Button>',
  icon: '<Button variant="outline" size="icon" aria-label="Facebook"><CoreuiIcon icon={cibFacebook} name="facebook" /></Button>',
  text: '<Button variant="outline">Facebook</Button>',
} as const;

const KINDS = ['both', 'icon', 'text'] as const;

export default async function BrandButtonsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'BrandButtonsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      {KINDS.map((kind) => (
        <DemoCard key={kind} title={t(`${kind}_title`)} description={t('brand_colors')}>
          <p className="form-label">{t('usage')}</p>
          <pre className="mt-2 mb-5 overflow-x-auto rounded-sm border border-ink-200 bg-ply px-3 py-2 font-mono text-[0.8125rem] text-ink-900">
            <code>{USAGE[kind]}</code>
          </pre>
          {SIZES.map((size) => (
            <DemoRow key={size} label={t(`size_${size}`)} className="gap-2">
              {BRANDS.map((brand) =>
                kind === 'icon' ? (
                  <Button
                    key={brand.id}
                    variant="outline"
                    size={ICON_SIZES[size]}
                    aria-label={brand.label}
                  >
                    <CoreuiIcon
                      icon={brand.icon}
                      name={`${kind}-${size}-${brand.id}`}
                      className={ICON_CLASS[size]}
                    />
                  </Button>
                ) : (
                  <Button key={brand.id} variant="outline" size={size}>
                    {kind === 'both' && (
                      <CoreuiIcon
                        icon={brand.icon}
                        name={`${kind}-${size}-${brand.id}`}
                        className={ICON_CLASS[size]}
                      />
                    )}
                    {brand.label}
                  </Button>
                ),
              )}
            </DemoRow>
          ))}
        </DemoCard>
      ))}
    </>
  );
}
