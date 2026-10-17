import type { LucideIcon } from 'lucide-react';
import { ArrowLeftIcon, BellIcon, Building2Icon, LanguagesIcon, StampIcon } from 'lucide-react';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { StampBox } from '@/components/crm/StampBox';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/Wordmark';
import { Link } from '@/libs/I18nNavigation';

const FEATURES = [
  { key: 'workspaces', icon: Building2Icon },
  { key: 'pipeline', icon: StampIcon },
  { key: 'follow_ups', icon: BellIcon },
  { key: 'languages', icon: LanguagesIcon },
] as const satisfies { key: string; icon: LucideIcon }[];

/**
 * A deal's stamp row, as the CRM draws it: three stages signed by members' seals, the open one
 * with its days, the next one blank. An illustration: the seals and days are made up.
 * @param props Component props.
 * @param props.days The open stage's days, formatted for the locale.
 * @returns The row, hidden from assistive technology.
 */
const StampRow = (props: { days: string }) => (
  <div aria-hidden="true" className="flex gap-1">
    <StampBox seal="AL" />
    <StampBox seal="AL" />
    <StampBox seal="KS" />
    <StampBox days={props.days} />
    <StampBox />
  </div>
);

export default async function AuthLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AuthLayout' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });
  const format = await getFormatter({ locale });
  const days = format.number(8, { style: 'unit', unit: 'day', unitDisplay: 'narrow' });

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* The seal side: what the CRM does, under a stamp row. All text is on-seal (4.9:1). */}
      <aside className="hidden flex-col justify-between gap-12 bg-seal p-10 text-on-seal lg:flex xl:p-14">
        <Wordmark tone="seal" />
        <div className="flex max-w-md flex-col gap-9">
          <StampRow days={days} />
          <div className="flex flex-col gap-3">
            <p className="text-3xl leading-tight font-bold tracking-[-0.02em]">
              {t('aside_title')}
            </p>
            <p className="text-lg leading-relaxed">{t('aside_text')}</p>
          </div>
          <ul className="flex flex-col border-t border-on-seal/30">
            {FEATURES.map((feature) => (
              <li
                key={feature.key}
                className="flex items-start gap-3.5 border-b border-on-seal/30 py-3.5"
              >
                <feature.icon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0"
                  strokeWidth={1.75}
                />
                <span className="leading-relaxed text-pretty">{t(`aside_${feature.key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="max-w-md text-sm leading-relaxed">{tBrand('sample_note')}</p>
      </aside>

      <div className="flex flex-col">
        {/* Below lg the aside folds into a slim band: the wordmark and the stamp row. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-seal px-4 py-3 text-on-seal sm:px-8 lg:hidden">
          <Wordmark tone="seal" />
          <StampRow days={days} />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-4 max-lg:justify-end sm:px-8">
          <Button asChild variant="ghost" size="sm" className="max-lg:hidden">
            <Link href="/">
              <ArrowLeftIcon data-icon="inline-start" />
              {t('back_home')}
            </Link>
          </Button>
          <LocaleSwitcher />
        </div>
        <main className="flex flex-1 justify-center px-4 pb-16 sm:px-8 lg:items-center lg:pt-6">
          <div className="w-full max-w-[25rem]">{props.children}</div>
        </main>
      </div>
    </div>
  );
}
