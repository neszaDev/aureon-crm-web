import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeftIcon, BellIcon, Building2Icon, LanguagesIcon, StampIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Button } from '@/components/ui/button';
import { BrandSeal, Wordmark } from '@/components/Wordmark';
import { Link } from '@/libs/I18nNavigation';

// A deal's stamp row: stages already signed, the open one outlined, the next one still blank.
const STAMPS = [
  { id: 1, state: 'signed', tilt: '-rotate-3' },
  { id: 2, state: 'signed', tilt: 'rotate-2' },
  { id: 3, state: 'signed', tilt: '-rotate-6' },
  { id: 4, state: 'open' },
  { id: 5, state: 'blank' },
] as const;

const FEATURES = [
  { key: 'workspaces', icon: Building2Icon },
  { key: 'pipeline', icon: StampIcon },
  { key: 'follow_ups', icon: BellIcon },
  { key: 'languages', icon: LanguagesIcon },
] as const satisfies { key: string; icon: LucideIcon }[];

export default async function AuthLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AuthLayout' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* The seal side: what the CRM does, under a stamp row. All text is on-seal (4.9:1). */}
      <aside className="hidden flex-col justify-between gap-12 bg-seal p-10 text-on-seal lg:flex xl:p-14">
        <Wordmark tone="seal" />
        <div className="flex max-w-md flex-col gap-9">
          <div aria-hidden="true" className="flex gap-1.5">
            {STAMPS.map((stamp) => (
              <span
                key={stamp.id}
                className={cn(
                  'grid size-14 place-items-center rounded-[3px] xl:size-16',
                  stamp.state === 'signed' && 'border border-on-seal/40 bg-seal-deep',
                  stamp.state === 'open' && 'border-2 border-on-seal',
                  stamp.state === 'blank' && 'border border-on-seal/40',
                )}
              >
                {stamp.state === 'signed' && (
                  <BrandSeal className={cn('size-10 xl:size-11', stamp.tilt)} />
                )}
              </span>
            ))}
          </div>
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
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Wordmark className="lg:hidden" />
          <Button asChild variant="ghost" size="sm" className="max-lg:hidden">
            <Link href="/">
              <ArrowLeftIcon data-icon="inline-start" />
              {t('back_home')}
            </Link>
          </Button>
          <LocaleSwitcher />
        </div>
        <main className="flex flex-1 items-center justify-center px-4 pt-6 pb-16 sm:px-8">
          <div className="w-full max-w-[25rem]">{props.children}</div>
        </main>
      </div>
    </div>
  );
}
