import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { freshDrawDelays } from '@/components/report/freshRows';
import { ResultsTable } from '@/components/report/ResultsTable';
import { TotalsStrip } from '@/components/report/TotalsStrip';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser, listTestResults } from '@/libs/api/Queries';
import { Link, redirect } from '@/libs/I18nNavigation';

const LATEST_COUNT = 5;

export default async function DashboardPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'DashboardPage' });
  const tAccount = await getTranslations({ locale, namespace: 'AccountPage' });
  const format = await getFormatter({ locale });

  const [{ user, unauthorized }, latest] = await Promise.all([
    getCurrentUser(),
    listTestResults(0, LATEST_COUNT),
  ]);
  if (unauthorized || latest.unauthorized || !user) {
    return redirect({ href: '/sign-in', locale });
  }

  const rows = latest.results?.content ?? [];

  return (
    <>
      <PageHeader
        title={t('title')}
        description={
          <>
            <span className="block font-semibold break-all text-ink-900">
              {t('hello_message', { email: user.email ?? '' })}
            </span>
            <span className="block">
              {t('account_details', {
                role: tAccount(`role_${user.role ?? 'USER'}`),
                since: user.createdAt
                  ? format.dateTime(new Date(user.createdAt), { dateStyle: 'medium' })
                  : '',
              })}
            </span>
          </>
        }
      />

      <section aria-labelledby="totals-heading" className="flex flex-col gap-4">
        <h2 id="totals-heading" className="text-lg font-bold tracking-[-0.01em] text-ink-950">
          {t('totals_title')}
        </h2>
        <TotalsStrip summary={latest.summary} />
      </section>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5">
          <CardTitle>
            <h2>{t('latest_title')}</h2>
          </CardTitle>
          {rows.length > 0 && (
            <CardAction>
              <Button asChild variant="link" size="sm">
                <Link href="/dashboard/test-results/">
                  {t('see_all')}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <div className="px-2 sm:px-3">
          <ResultsTable
            rows={rows}
            drawDelays={freshDrawDelays(rows, latest.readAt)}
            empty={
              <>
                <p className="text-lg font-bold text-ink-950">{t('empty_title')}</p>
                <p className="max-w-sm text-[0.9375rem] text-ink-600">{t('empty_text')}</p>
                <Button asChild className="mt-2">
                  <Link href="/dashboard/test-results/">
                    <PlusIcon data-icon="inline-start" />
                    {t('empty_cta')}
                  </Link>
                </Button>
              </>
            }
          />
        </div>
      </Card>
    </>
  );
}
