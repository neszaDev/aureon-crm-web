import { cn } from 'cn';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * A hero band that calls attention to one message.
 * @param props Component props.
 * @param props.className Extra classes (the fill).
 * @param props.children The hero content.
 * @returns The band.
 */
const Jumbotron = (props: { className?: string; children: React.ReactNode }) => (
  <section
    className={cn(
      'flex flex-col items-start gap-4 rounded-lg bg-ink-100 px-6 py-10 text-ink-900 sm:px-10 sm:py-14',
      props.className,
    )}
  >
    {props.children}
  </section>
);

const DISPLAY =
  'text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.02] font-extrabold tracking-[-0.035em] break-words';

export default async function JumbotronsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'JumbotronsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DemoCard title={t('basic_title')}>
          <Jumbotron>
            <h3 className={cn(DISPLAY, 'text-ink-950')}>{t('display')}</h3>
            <p className="text-lg leading-relaxed">{t('basic_lead')}</p>
            <p className="text-ink-700">{t('basic_text')}</p>
            <Button asChild>
              <Link href="/about/">{t('more_info')}</Link>
            </Button>
          </Jumbotron>
        </DemoCard>

        <DemoCard title={t('slots_title')} description={t('slots_description')}>
          <Jumbotron>
            <h3 className={cn(DISPLAY, 'text-ink-950')}>{t('display')}</h3>
            <p className="text-lg leading-relaxed">{t('hero_lead')}</p>
            <hr className="my-2 w-full border-ink-300" />
            <p className="text-ink-700">{t('hero_text')}</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/test-results/">{t('do_something')}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/account/">{t('do_something_else')}</Link>
              </Button>
            </div>
          </Jumbotron>
        </DemoCard>
      </div>

      <DemoCard title={t('colors_title')} description={t('colors_description')}>
        <Jumbotron className="border border-folder-deep bg-folder text-folder-ink">
          <h3 className={DISPLAY}>{t('display')}</h3>
          <p className="text-lg leading-relaxed">{t('hero_lead')}</p>
          <hr className="my-2 w-full border-folder-ink-soft/40" />
          <p className="text-folder-ink-soft">{t('hero_text')}</p>
        </Jumbotron>
      </DemoCard>
    </>
  );
}
