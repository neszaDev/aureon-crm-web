import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { SEAL_PRIMARY_BUTTON, SEAL_OUTLINE_BUTTON } from '@/components/marketing/sealButton';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/Wordmark';
import { Link } from '@/libs/I18nNavigation';
import { AppConfig } from '@/utils/AppConfig';

// The landing page's sections, linked from the header from 1280 px.
const SECTIONS = ['how-it-works', 'features', 'roles', 'developers'] as const;

const NAV_LINK =
  'rounded-md px-2.5 py-1.5 text-[0.9375rem] font-medium text-on-seal no-underline hover:bg-black/10 focus-visible:outline-on-seal';

/**
 * Public pages: the vermilion header (the top of the landing page's band), the page on the
 * ground, and a footer with the sample-product note.
 * @param props Component props.
 * @param props.children Page content.
 * @returns The marketing layout.
 */
export const MarketingTemplate = (props: { children: React.ReactNode }) => {
  const t = useTranslations('RootLayout');
  const tFooter = useTranslations('Footer');
  const tBrand = useTranslations('Brand');
  const labels = {
    'how-it-works': t('how_link'),
    features: t('features_link'),
    roles: t('roles_link'),
    developers: t('developers_link'),
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only rounded-md bg-field text-sm font-semibold text-foreground shadow-sheet focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2"
      >
        {t('skip_link')}
      </a>
      <header className="bg-seal text-on-seal">
        <div className="mx-auto flex h-16 max-w-[76rem] items-center gap-8 px-4 sm:px-7 lg:h-18">
          <Wordmark tone="seal" />
          <nav aria-label={t('main_navigation_label')} className="flex flex-1 items-center gap-2">
            <ul className="hidden items-center gap-1 xl:flex">
              {SECTIONS.map((section) => (
                <li key={section}>
                  <Link href={{ pathname: '/', hash: section }} className={NAV_LINK}>
                    {labels[section]}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/about" className={NAV_LINK}>
                  {t('about_link')}
                </Link>
              </li>
            </ul>
            <div className="ml-auto flex items-center gap-2">
              <LocaleSwitcher tone="seal" />
              <Button asChild variant="ghost" size="sm" className={SEAL_OUTLINE_BUTTON}>
                <Link href="/sign-in">{t('sign_in_link')}</Link>
              </Button>
              <Button asChild size="sm" className={`${SEAL_PRIMARY_BUTTON} max-sm:hidden`}>
                <Link href="/sign-up">{t('sign_up_link')}</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Focusable so the skip link moves focus here in Safari too. */}
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {props.children}
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[76rem] flex-col gap-6 px-4 py-10 sm:px-7 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="flex max-w-md flex-col gap-2.5">
            <Wordmark className="self-start" />
            <p className="text-sm text-ink-2">{tBrand('sample_note')}</p>
          </div>
          <nav
            aria-label={tFooter('footer_navigation_label')}
            className="flex flex-col gap-1.5 text-sm md:items-end"
          >
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
              <li>
                <Link href="/about" className="font-medium text-seal-ink hover:underline">
                  {t('about_link')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="font-medium text-seal-ink hover:underline">
                  {tFooter('template_link')}
                </Link>
              </li>
            </ul>
            <p className="text-ink-2">
              {tFooter('footer_text', { year: new Date().getFullYear(), name: AppConfig.name })}
            </p>
          </nav>
        </div>
      </footer>
    </div>
  );
};
