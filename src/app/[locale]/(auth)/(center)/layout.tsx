import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/Wordmark';
import { formatMoney, initialsOf } from '@/libs/crm/Format';
import { LEAD_STATUS_TONES, PILL } from '@/libs/crm/StatusColors';
import { Link } from '@/libs/I18nNavigation';

// The sample's leads, by their message number: made-up people, owners and estimated values.
const SAMPLE = [
  { n: 1, value: '18500' },
  { n: 2, value: '42000' },
  { n: 3, value: '7300' },
] as const;

/**
 * A status section as the CRM's lists draw it, in a sample workspace: where it is, the Qualified
 * pill with its count, and three leads with their owners' avatars and estimated values. An
 * illustration: hidden from assistive technology, which reads its description instead. Drawn from
 * the pill's and the avatars' looks rather than `StatusPill` and `PersonAvatar`, whose menu and
 * tooltip code this static page would otherwise load.
 * @param props Component props.
 * @param props.place The sample workspace's name.
 * @param props.list The list it shows ("Leads").
 * @param props.status The section's status.
 * @param props.description What it shows, in words.
 * @param props.rows The leads.
 * @returns The sample.
 */
const SampleSection = (props: {
  place: string;
  list: string;
  status: string;
  description: string;
  rows: { name: string; owner: string; ownerId: number; value: string }[];
}) => (
  <div>
    <p className="sr-only">{props.description}</p>
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-lg border border-rule bg-card text-card-foreground shadow-overlay"
    >
      <div className="flex h-10 items-center gap-1.5 border-b border-rule px-4 text-[0.8125rem] text-muted-foreground">
        <span className="truncate">{props.place}</span>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <span className="truncate font-medium text-foreground">{props.list}</span>
      </div>
      <div className="px-4 pt-2 pb-1.5">
        <div className="-ml-1.5 flex h-9 items-center gap-2 text-sm font-semibold">
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          <span data-tone={LEAD_STATUS_TONES.QUALIFIED} className={PILL}>
            <span className="size-2 shrink-0 rounded-full bg-(--tone)" />
            {props.status}
          </span>
          <span className="font-medium text-muted-foreground tabular-nums">
            {props.rows.length}
          </span>
        </div>
        <ul className="border-t border-rule">
          {props.rows.map((row) => (
            <li
              key={row.name}
              className="flex h-9 items-center gap-3 border-b border-rule text-[0.8125rem] last:border-b-0"
            >
              <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
              <span
                style={{ backgroundColor: `var(--avatar-${row.ownerId})` }}
                className="inline-grid size-5 shrink-0 place-items-center rounded-full text-[0.6875rem] leading-none font-semibold text-white"
              >
                {initialsOf(row.owner, '')}
              </span>
              <span className="w-24 shrink-0 text-right tabular-nums">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
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
  const tLeads = await getTranslations({ locale, namespace: 'LeadsPage' });
  const tStatus = await getTranslations({ locale, namespace: 'LeadStatus' });

  // Every message, for the forms' client components (the root layout passes the public pages').
  return (
    <NextIntlClientProvider>
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* The brand side, from 1024 px: the mark, what the CRM does, and a sample of it. White
            on Aureon violet (6.25:1); in the dark theme on its deep tint. */}
        <aside className="hidden flex-col justify-between gap-12 bg-violet p-10 text-on-rail lg:flex xl:p-14 dark:bg-violet-tint">
          <Wordmark tone="brand" className="self-start" />
          <div className="flex max-w-md flex-col gap-10">
            <p className="text-[1.5rem] leading-tight font-semibold tracking-[-0.02em] text-balance">
              {t('aside_text')}
            </p>
            <SampleSection
              place={t('sample_label')}
              list={tLeads('title')}
              status={tStatus('status_QUALIFIED')}
              description={t('sample_description')}
              rows={SAMPLE.map((lead) => ({
                name: t(`sample_lead_${lead.n}`),
                owner: t(`sample_owner_${lead.n}`),
                ownerId: lead.n,
                value: formatMoney(lead.value, 'USD', locale, { short: true }),
              }))}
            />
          </div>
          <p className="max-w-md text-sm leading-relaxed">{tBrand('sample_note')}</p>
        </aside>

        <div className="flex flex-col">
          {/* Below 1024 px the form is alone, under the mark. */}
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
            <Wordmark className="lg:hidden" />
            <Button asChild variant="ghost" size="sm" className="-ml-2.5 max-lg:hidden">
              <Link href="/">
                <ArrowLeftIcon data-icon="inline-start" />
                {t('back_home')}
              </Link>
            </Button>
            <LocaleSwitcher />
          </div>
          <main className="flex flex-1 justify-center px-4 pt-6 pb-16 sm:px-8 sm:pt-10 lg:items-center lg:pt-0">
            <div className="w-full max-w-[24rem]">{props.children}</div>
          </main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
