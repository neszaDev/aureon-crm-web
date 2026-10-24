import { ArrowRightIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  BRAND_OUTLINE_BUTTON,
  BRAND_PRIMARY_BUTTON,
  LANDING_ACTION,
} from '@/components/marketing/brandButton';
import { HeroShot } from '@/components/marketing/HeroShot';
import { Note, Row } from '@/components/marketing/Row';
import { Shot } from '@/components/marketing/Shot';
import {
  SampleAvatar,
  SamplePill,
  SampleRecord,
  SampleTrack,
} from '@/components/marketing/TrackSample';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/libs/crm/Format';
import { LEAD_STATUS_TONES } from '@/libs/crm/StatusColors';
import { Link } from '@/libs/I18nNavigation';
import { routing } from '@/libs/I18nRouting';
import boardThaiDark from '@/public/landing/board-390-th-dark.webp';
import boardThaiLight from '@/public/landing/board-390-th-light.webp';
import boardDark from '@/public/landing/board-dark.webp';
import boardPhoneDark from '@/public/landing/board-hero-390-dark.webp';
import boardPhoneLight from '@/public/landing/board-hero-390-light.webp';
import boardPhoneThaiDark from '@/public/landing/board-hero-390-th-dark.webp';
import boardPhoneThaiLight from '@/public/landing/board-hero-390-th-light.webp';
import boardLight from '@/public/landing/board-light.webp';
import dashboardPhoneDark from '@/public/landing/dashboard-390-dark.webp';
import dashboardPhoneLight from '@/public/landing/dashboard-390-light.webp';
import dashboardPhoneThaiDark from '@/public/landing/dashboard-390-th-dark.webp';
import dashboardPhoneThaiLight from '@/public/landing/dashboard-390-th-light.webp';
import dashboardDark from '@/public/landing/dashboard-dark.webp';
import dashboardLight from '@/public/landing/dashboard-light.webp';
import dealPhoneDark from '@/public/landing/deal-390-dark.webp';
import dealPhoneLight from '@/public/landing/deal-390-light.webp';
import dealPhoneThaiDark from '@/public/landing/deal-390-th-dark.webp';
import dealPhoneThaiLight from '@/public/landing/deal-390-th-light.webp';
import dealDark from '@/public/landing/deal-dark.webp';
import dealLight from '@/public/landing/deal-light.webp';
import listPhoneDark from '@/public/landing/deals-list-390-dark.webp';
import listPhoneLight from '@/public/landing/deals-list-390-light.webp';
import listPhoneThaiDark from '@/public/landing/deals-list-390-th-dark.webp';
import listPhoneThaiLight from '@/public/landing/deals-list-390-th-light.webp';
import listDark from '@/public/landing/deals-list-dark.webp';
import listLight from '@/public/landing/deals-list-light.webp';
import reportsPhoneDark from '@/public/landing/reports-390-dark.webp';
import reportsPhoneLight from '@/public/landing/reports-390-light.webp';
import reportsPhoneThaiDark from '@/public/landing/reports-390-th-dark.webp';
import reportsPhoneThaiLight from '@/public/landing/reports-390-th-light.webp';
import reportsDark from '@/public/landing/reports-dark.webp';
import reportsLight from '@/public/landing/reports-light.webp';
// Where each ring sits on its capture: measured by the capture script.
import spots from '@/public/landing/spots.json';
import tasksDark from '@/public/landing/tasks-dark.webp';
import inboxDark from '@/public/landing/tasks-inbox-dark.webp';
import inboxLight from '@/public/landing/tasks-inbox-light.webp';
import inboxThaiDark from '@/public/landing/tasks-inbox-th-dark.webp';
import inboxThaiLight from '@/public/landing/tasks-inbox-th-light.webp';
import tasksLight from '@/public/landing/tasks-light.webp';
import { AppConfig } from '@/utils/AppConfig';

type IndexPageProps = {
  params: Promise<{ locale: string }>;
};

// A capture in the main column: 800 px from 1280, the column's share of the page below.
const MAIN_SIZES = '(min-width: 1280px) 800px, (min-width: 1024px) calc(100vw - 24rem), 100vw';

// The demo workspace's people and deals (fictional, from its seed) as the captures show them,
// avatars in the colours the app gives their member ids, and its deals' stages by name (a
// workspace's own data, not translated).
const MIA = { name: 'Mia Rossi', colour: 1 };
const RILEY = { name: 'Riley Chen', colour: 2 };
const OPEN_STAGES = 4;
// Open, in the third of its four open stages for a day.
const FLEET = { name: 'Brightwater fleet tablets', amount: '18500', stage: 'Proposal', index: 3 };
// Won: its track is the open stages and Won.
const DEPOT = { name: 'Brightwater depot rollout', amount: '42000', stage: 'Won' };

// Display headings: tight Latin leading, opened under Thai so stacked marks never clip.
const DISPLAY = 'font-bold text-balance [:lang(th)_&]:leading-[1.35]';
const H2 = `${DISPLAY} text-[2rem] leading-[1.1] tracking-[-0.03em] lg:text-[2.75rem]`;
const LEDE = 'max-w-[56ch] text-lg leading-relaxed text-ink-2';
const CAPTION = 'text-[0.8125rem] text-ink-2';
const CODE =
  'rounded-[3.6px] bg-muted px-1 py-px font-mono text-[0.8125rem] whitespace-nowrap text-foreground';

export async function generateMetadata(props: IndexPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Index' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    openGraph: {
      title: t('meta_title'),
      description: t('meta_description'),
      siteName: AppConfig.name,
      locale,
      type: 'website',
    },
  };
}

export default async function IndexPage(props: IndexPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Index' });
  const tStatus = await getTranslations({ locale, namespace: 'LeadStatus' });
  const tTrack = await getTranslations({ locale, namespace: 'StatusTrack' });
  const tHeader = await getTranslations({ locale, namespace: 'RecordHeader' });
  const code = (chunks: React.ReactNode) => <code className={CODE}>{chunks}</code>;
  const devLabel = t('dev_label');
  const caption = (screen: string) => t('demo_caption', { screen });
  // The Thai page shows its sections' phone crops in Thai.
  const thai = locale === 'th';
  const money = (amount: string) => formatMoney(amount, 'EUR', locale);
  const owner = tHeader('owner', { name: MIA.name });

  // The headline as each language's own file has it.
  const languages = await Promise.all(
    routing.locales.map(async (language) => {
      const tLanguage = await getTranslations({ locale: language, namespace: 'Index' });
      return { language, name: tLanguage('language_name'), title: tLanguage('title') };
    }),
  );

  const tRoles = await getTranslations({ locale, namespace: 'Roles' });
  const roles = [
    { role: tRoles('role_OWNER'), text: t('role_owner') },
    { role: tRoles('role_ADMIN'), text: t('role_admin') },
    { role: tRoles('role_MANAGER'), text: t('role_manager') },
    { role: tRoles('role_SALES_REP'), text: t('role_rep') },
  ];

  const facts = [
    { title: t('fact_next_title'), text: t('fact_next') },
    { title: t('fact_spring_title'), text: t('fact_spring') },
    { title: t('fact_tenancy_title'), text: t('fact_tenancy') },
    { title: t('fact_types_title'), text: t('fact_types') },
    { title: t('fact_e2e_title'), text: t('fact_e2e') },
    { title: t('fact_docs_title'), text: t('fact_docs') },
  ];

  const faqs = [
    { q: t('faq_sample_q'), a: t('faq_sample_a') },
    { q: t('faq_join_q'), a: t('faq_join_a') },
    { q: t('faq_email_q'), a: t('faq_email_a') },
    { q: t('faq_currency_q'), a: t('faq_currency_a') },
    { q: t('faq_delete_q'), a: t('faq_delete_a') },
    { q: t('faq_run_q'), a: t.rich('faq_run_a', { code }) },
  ];

  // Each step as the app draws its record: a new lead with its owner, a qualified one on its
  // lifecycle, a won deal with every stage reached.
  const steps = [
    {
      title: t('step_capture_title'),
      text: t('step_capture_text'),
      pill: <SamplePill tone={LEAD_STATUS_TONES.NEW} label={tStatus('status_NEW')} />,
      track: <SampleTrack tone={LEAD_STATUS_TONES.NEW} steps={4} reached={1} />,
    },
    {
      title: t('step_qualify_title'),
      text: t('step_qualify_text'),
      pill: <SamplePill tone={LEAD_STATUS_TONES.QUALIFIED} label={tStatus('status_QUALIFIED')} />,
      track: <SampleTrack tone={LEAD_STATUS_TONES.QUALIFIED} steps={4} reached={3} />,
    },
    {
      title: t('step_close_title'),
      text: t('step_close_text'),
      pill: <SamplePill tone="green" label={DEPOT.stage} />,
      track: <SampleTrack tone="green" steps={OPEN_STAGES + 1} reached={OPEN_STAGES + 1} />,
    },
  ];

  const actions = (
    <div className="flex flex-wrap gap-2.5">
      <Button asChild size="lg" className={`${BRAND_PRIMARY_BUTTON} ${LANDING_ACTION}`}>
        <Link href="/sign-up">
          {t('cta')}
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        size="lg"
        className={`${BRAND_OUTLINE_BUTTON} ${LANDING_ACTION}`}
      >
        <Link href="/sign-in">{t('sign_in')}</Link>
      </Button>
    </div>
  );

  return (
    <>
      {/* The band: the header's violet runs on into the hero, down into the board's sheet. */}
      <section aria-labelledby="hero-title" className="text-white">
        <div className="bg-violet dark:bg-violet-tint">
          <div className="mx-auto max-w-[76rem] px-4 pt-8 sm:px-7 lg:pt-10">
            {/* A deal of the demo workspace as the app draws it: its pill, its track (filling up
                to its stage), its owner. */}
            <SampleRecord
              className="max-w-[48rem]"
              description={t('track_label', {
                deal: FLEET.name,
                amount: money(FLEET.amount),
                stage: FLEET.stage,
                index: FLEET.index,
                count: OPEN_STAGES,
                owner: MIA.name,
              })}
              name={FLEET.name}
              amount={money(FLEET.amount)}
              pill={<SamplePill tone="violet" label={FLEET.stage} />}
              track={
                <SampleTrack
                  tone="violet"
                  steps={OPEN_STAGES}
                  reached={FLEET.index}
                  fill={250}
                  className="flex-1 sm:min-w-32"
                >
                  {tTrack('days_short', { count: 1 })}
                </SampleTrack>
              }
              owner={owner}
              person={MIA}
            />
            <h1
              id="hero-title"
              className={`${DISPLAY} mt-7 max-w-[64rem] text-[2.75rem] leading-[1.04] tracking-[-0.035em] sm:text-6xl lg:text-[5rem] lg:leading-[1.02]`}
            >
              {t('title')}
            </h1>

            <div className="mt-8 grid border-t border-white/45 md:grid-cols-2 lg:mt-9">
              <div className="flex flex-col gap-3.5 pt-5 md:pr-12">
                {/* On a phone the desks stack under the headline: the team's needs no label. */}
                <p className="text-[0.8125rem] font-medium max-md:hidden">{t('team_label')}</p>
                <p className="max-w-[34ch] text-lg leading-snug font-medium lg:text-[1.375rem]">
                  {t('team_text')}
                </p>
                <div className="pt-1">{actions}</div>
              </div>
              <div className="mt-7 flex flex-col gap-3.5 border-t border-white/45 pt-5 md:mt-0 md:border-t-0 md:border-l md:pl-12">
                <p className="text-[0.8125rem] font-medium">{devLabel}</p>
                {/* On a phone the desk keeps its commands; the developers' section says the rest. */}
                <p className="max-w-[46ch] max-md:hidden">{t('dev_text')}</p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  <code className="flex w-max rounded-md bg-rail font-mono text-[0.8125rem] leading-normal">
                    <span className="px-3.5 py-1.5">make setup</span>
                    <span className="border-l border-white/25 px-3.5 py-1.5">pnpm dev</span>
                  </code>
                  <a
                    href={AppConfig.sourceUrl}
                    className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-white underline underline-offset-4 focus-visible:outline-white"
                  >
                    {t('code_link')}
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The band's edge runs through the sheet, wherever the sheet's height puts it. */}
        <div className="bg-[linear-gradient(var(--violet)_0_45%,var(--canvas)_45%)] dark:bg-[linear-gradient(var(--violet-tint)_0_45%,var(--canvas)_45%)]">
          <figure className="mx-auto flex max-w-[76rem] flex-col gap-3 px-4 pt-8 pb-8 sm:px-7 md:pt-10">
            <HeroShot
              light={{ wide: boardLight, narrow: thai ? boardPhoneThaiLight : boardPhoneLight }}
              dark={{ wide: boardDark, narrow: thai ? boardPhoneThaiDark : boardPhoneDark }}
              alt={t('hero_alt')}
            />
            <figcaption className={CAPTION}>{caption(t('hero_screen'))}</figcaption>
          </figure>
        </div>
      </section>

      <div className="mx-auto max-w-[76rem] px-4 sm:px-7">
        <Row
          id="how-it-works"
          titleId="how-title"
          className="border-t-0 lg:pt-26"
          note={
            <Note
              label={devLabel}
              lead={
                <p className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">{devLabel}</span>
                  <span>{t('how_note_lead')}</span>
                </p>
              }
            >
              {t('how_note')}
            </Note>
          }
        >
          <h2 id="how-title" className={H2}>
            {t('how_title')}
          </h2>
          <p className={LEDE}>{t('how_text')}</p>
          <ol className="mt-4 grid gap-8 md:grid-cols-3 md:gap-0">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-2.5 md:border-l md:border-rule md:px-6 md:first:border-l-0 md:first:pl-0"
              >
                <div aria-hidden="true" className="flex flex-col gap-3">
                  <span className="flex items-center gap-2">
                    {step.pill}
                    {/* The lead's owner from the start; the deal's to the end. */}
                    <SampleAvatar person={index === 2 ? MIA : RILEY} />
                  </span>
                  {step.track}
                </div>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-[0.9375rem] text-ink-2">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className={CAPTION}>{t('how_caption')}</p>
        </Row>

        <Row
          id="features"
          titleId="lists-title"
          note={
            <Note label={devLabel} spot={t('lists_spot')}>
              {t('lists_note')}
            </Note>
          }
        >
          <h2 id="lists-title" className={H2}>
            {t('lists_title')}
          </h2>
          <p className={LEDE}>{t('lists_text')}</p>
          <figure className="mt-4 flex flex-col gap-2">
            <Shot
              light={listLight}
              dark={listDark}
              narrow={
                thai
                  ? { light: listPhoneThaiLight, dark: listPhoneThaiDark }
                  : { light: listPhoneLight, dark: listPhoneDark }
              }
              alt={t('lists_alt')}
              sizes={MAIN_SIZES}
              spot={spots.lists}
            />
            <figcaption className={CAPTION}>{caption(t('lists_screen'))}</figcaption>
          </figure>
        </Row>

        <Row
          titleId="deal-title"
          note={
            <Note label={devLabel} spot={t('deal_spot')}>
              {t('deal_note')}
            </Note>
          }
        >
          <h2 id="deal-title" className={H2}>
            {t('deal_title')}
          </h2>
          <p className={LEDE}>{t('deal_text')}</p>
          <figure className="mt-4 flex flex-col gap-2">
            <Shot
              light={dealLight}
              dark={dealDark}
              narrow={
                thai
                  ? { light: dealPhoneThaiLight, dark: dealPhoneThaiDark }
                  : { light: dealPhoneLight, dark: dealPhoneDark }
              }
              alt={t('deal_alt')}
              sizes={MAIN_SIZES}
              spot={spots.deal}
            />
            <figcaption className={CAPTION}>{caption(t('deal_screen'))}</figcaption>
          </figure>
        </Row>

        <Row
          titleId="tasks-title"
          note={
            <Note label={devLabel} spot={t('tasks_spot')}>
              {t('tasks_note')}
            </Note>
          }
        >
          <h2 id="tasks-title" className={H2}>
            {t('tasks_title')}
          </h2>
          <p className={LEDE}>{t('tasks_text')}</p>
          <figure className="mt-4 flex flex-col gap-2">
            <Shot
              light={tasksLight}
              dark={tasksDark}
              narrow={
                thai
                  ? { light: inboxThaiLight, dark: inboxThaiDark }
                  : { light: inboxLight, dark: inboxDark }
              }
              alt={t('tasks_alt')}
              sizes={MAIN_SIZES}
              spot={spots.tasks}
            />
            <figcaption className={CAPTION}>{caption(t('tasks_screen'))}</figcaption>
          </figure>
        </Row>

        <Row titleId="insights-title" note={<Note label={devLabel}>{t('insights_note')}</Note>}>
          <h2 id="insights-title" className={H2}>
            {t('insights_title')}
          </h2>
          <p className={LEDE}>{t('insights_text')}</p>
          <figure className="mt-4 flex flex-col gap-4">
            <Shot
              light={dashboardLight}
              dark={dashboardDark}
              narrow={
                thai
                  ? { light: dashboardPhoneThaiLight, dark: dashboardPhoneThaiDark }
                  : { light: dashboardPhoneLight, dark: dashboardPhoneDark }
              }
              alt={t('dashboard_alt')}
              sizes={MAIN_SIZES}
            />
            <Shot
              light={reportsLight}
              dark={reportsDark}
              narrow={
                thai
                  ? { light: reportsPhoneThaiLight, dark: reportsPhoneThaiDark }
                  : { light: reportsPhoneLight, dark: reportsPhoneDark }
              }
              alt={t('reports_alt')}
              sizes={MAIN_SIZES}
            />
            <figcaption className={CAPTION}>{caption(t('insights_screen'))}</figcaption>
          </figure>
        </Row>

        <Row
          id="roles"
          titleId="roles-title"
          note={<Note label={devLabel}>{t('roles_note')}</Note>}
        >
          <h2 id="roles-title" className={H2}>
            {t('roles_title')}
          </h2>
          <p className={LEDE}>{t('roles_text')}</p>
          <div className="mt-4 rounded-lg border border-rule bg-card">
            <div className="flex items-baseline justify-between gap-4 border-b border-rule px-5 py-4">
              <h3 className="font-semibold">{t('roles_heading')}</h3>
              <span className="text-sm text-ink-2">{t('roles_count')}</span>
            </div>
            <ul className="divide-y divide-rule">
              {roles.map((item) => (
                <li
                  key={item.role}
                  className="grid gap-x-5 gap-y-1 px-5 py-3.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-baseline"
                >
                  <span className="font-semibold">{item.role}</span>
                  <span className="text-[0.9375rem] text-ink-2">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </Row>

        <Row
          titleId="langs-title"
          note={<Note label={devLabel}>{t.rich('langs_note', { code })}</Note>}
        >
          <h2 id="langs-title" className={H2}>
            {t('langs_title')}
          </h2>
          <p className={LEDE}>{t('langs_text')}</p>
          <div className="mt-4 grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_15rem]">
            <ul className="divide-y divide-rule">
              {languages.map((item) => (
                <li
                  key={item.language}
                  lang={item.language}
                  className="flex flex-col gap-1 py-4 first:pt-0"
                >
                  <span className="text-[0.8125rem] font-medium text-ink-2">{item.name}</span>
                  <span className="text-[1.625rem] leading-tight font-semibold tracking-[-0.01em] [:lang(th)_&]:leading-normal">
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
            <figure className="flex flex-col gap-2 max-md:max-w-[17.5rem]">
              <Shot
                light={boardThaiLight}
                dark={boardThaiDark}
                alt={t('langs_alt')}
                sizes="(min-width: 768px) 240px, 280px"
              />
              <figcaption className={CAPTION}>{caption(t('langs_screen'))}</figcaption>
            </figure>
          </div>
        </Row>

        <section
          id="developers"
          aria-labelledby="dev-title"
          className="grid scroll-mt-6 gap-10 border-t border-rule py-16 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16 lg:py-22 xl:grid-cols-[32.5rem_minmax(0,1fr)]"
        >
          <div className="flex flex-col gap-5">
            <h2 id="dev-title" className={H2}>
              {t('dev_title')}
            </h2>
            <p className="text-lg leading-relaxed text-ink-2">{t('dev_lead')}</p>
            {/* The commands on the ink-violet, the hero's chip grown to both repositories. */}
            <pre className="rounded-lg bg-rail px-4 py-3 font-mono text-[0.8125rem] leading-7 text-on-rail">
              <code>
                <span className="text-white/70"># aureon-crm-api</span>
                {'\nmake setup\nmake up\n'}
                <span className="text-white/70"># aureon-crm-web</span>
                {'\nmake setup\npnpm dev'}
              </code>
            </pre>
            <p className="text-[0.9375rem] text-ink-2">{t('dev_readme')}</p>
            <Button asChild variant="outline" className="self-start">
              <a href={AppConfig.sourceUrl}>
                {t('code_link')}
                <ArrowRightIcon data-icon="inline-end" />
              </a>
            </Button>
          </div>
          <dl className="grid self-start rounded-lg border border-rule bg-card sm:grid-cols-2">
            {facts.map((fact) => (
              <div
                key={fact.title}
                className="flex flex-col gap-0.5 border-t border-rule px-5 py-4 first:border-t-0 sm:even:border-l sm:nth-2:border-t-0"
              >
                <dt className="font-semibold">{fact.title}</dt>
                <dd className="text-[0.9375rem] text-ink-2">{fact.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-rule py-16 lg:py-22">
          <h2 id="faq-title" className={H2}>
            {t('faq_title')}
          </h2>
          <div className="mt-8 grid gap-x-16 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q} className="flex flex-col gap-1.5 border-t border-rule py-5">
                <h3 className="text-lg leading-snug font-semibold">{faq.q}</h3>
                <p className="max-w-[60ch] text-ink-2">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="close-title" className="bg-violet text-white dark:bg-violet-tint">
        <div className="mx-auto grid max-w-[76rem] gap-10 px-4 py-20 sm:px-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-end lg:gap-16 lg:py-24">
          <div className="flex flex-col gap-5">
            <h2
              id="close-title"
              className={`${DISPLAY} max-w-[16ch] text-[2.5rem] leading-[1.05] tracking-[-0.035em] lg:text-[3.75rem]`}
            >
              {t('close_title')}
            </h2>
            <p className="max-w-[44ch] text-lg lg:text-xl">{t('close_text')}</p>
            <div className="pt-3">{actions}</div>
          </div>
          {/* A won deal of the demo workspace: every stage reached, its track closed in green. */}
          <SampleRecord
            description={t('close_track_label', {
              deal: DEPOT.name,
              amount: money(DEPOT.amount),
              owner: MIA.name,
            })}
            name={DEPOT.name}
            amount={money(DEPOT.amount)}
            pill={<SamplePill tone="green" label={DEPOT.stage} />}
            track={
              <SampleTrack
                tone="green"
                steps={OPEN_STAGES + 1}
                reached={OPEN_STAGES + 1}
                className="flex-1 sm:min-w-24"
              />
            }
            owner={owner}
            person={MIA}
          />
        </div>
      </section>
    </>
  );
}
