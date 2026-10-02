import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/Wordmark';
import { Link } from '@/libs/I18nNavigation';
import { AppConfig } from '@/utils/AppConfig';

/**
 * Public pages: the folder-green header band, the page, and the footer.
 * @param props Component props.
 * @param props.children Page content.
 * @returns The marketing layout.
 */
export const MarketingTemplate = (props: { children: React.ReactNode }) => {
  const t = useTranslations('RootLayout');
  const tFooter = useTranslations('Footer');
  const tBrand = useTranslations('Brand');

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-folder text-folder-ink">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Wordmark tone="folder" />
          <nav aria-label={t('main_navigation_label')} className="flex flex-1 items-center gap-1">
            <Button asChild variant="inverse-ghost" size="sm" className="max-sm:hidden">
              <Link href="/about/">{t('about_link')}</Link>
            </Button>
            <div className="ml-auto flex items-center gap-1.5">
              <Button asChild variant="inverse-ghost" size="sm">
                <Link href="/sign-in/">{t('sign_in_link')}</Link>
              </Button>
              <Button asChild variant="inverse" size="sm">
                <Link href="/sign-up/">{t('sign_up_link')}</Link>
              </Button>
              <LocaleSwitcher tone="folder" className="ml-1.5 max-sm:hidden" />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">{props.children}</main>

      <footer className="bg-folder-deep text-folder-ink-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
          <div className="flex max-w-md flex-col gap-3">
            <Wordmark tone="folder" />
            <p className="text-sm">{tBrand('sample_note')}</p>
          </div>
          <nav
            aria-label={tFooter('footer_navigation_label')}
            className="flex flex-col gap-2 text-sm md:items-end"
          >
            <ul className="flex flex-wrap gap-x-5 gap-y-2 sm:hidden">
              <li>
                <Link href="/about/" className="text-folder-ink underline-offset-4 hover:underline">
                  {t('about_link')}
                </Link>
              </li>
            </ul>
            {/* On phones the language picker lives here, so the header keeps both actions. */}
            <LocaleSwitcher tone="folder" className="sm:hidden" />
            <Link href="/about/" className="text-folder-ink underline-offset-4 hover:underline">
              {tFooter('template_link')}
            </Link>
            <p>
              {tFooter('footer_text', { year: new Date().getFullYear(), name: AppConfig.name })}
            </p>
          </nav>
        </div>
      </footer>
    </div>
  );
};
