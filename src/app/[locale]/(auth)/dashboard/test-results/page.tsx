import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DeleteTestResultButton } from '@/components/DeleteTestResultButton';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { freshDrawDelays } from '@/components/report/freshRows';
import { ResultsTable } from '@/components/report/ResultsTable';
import { TotalsStrip } from '@/components/report/TotalsStrip';
import { TestResultForm } from '@/components/TestResultForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listTestResults } from '@/libs/api/Queries';
import { redirect } from '@/libs/I18nNavigation';

const PAGE_SIZE = 10;

type TestResultsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function TestResultsPage(props: TestResultsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TestResultsPage' });
  const searchParams = await props.searchParams;
  const page = Math.max(Math.trunc(Number(searchParams.page ?? '0')) || 0, 0);

  const { results, summary, readAt, unauthorized } = await listTestResults(page, PAGE_SIZE);
  if (unauthorized) {
    return redirect({ href: '/sign-in', locale });
  }

  const rows = results?.content ?? [];
  const totalPages = results?.totalPages ?? 0;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <TotalsStrip summary={summary} />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="xl:sticky xl:top-12 xl:col-start-2 xl:row-start-1">
          <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5">
            <CardTitle>
              <h2 id="create-heading">{t('create_title')}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TestResultForm />
          </CardContent>
        </Card>

        <Card className="gap-0 pb-0 xl:col-start-1 xl:row-start-1">
          <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5">
            <CardTitle>
              <h2 id="list-heading">{t('list_title')}</h2>
            </CardTitle>
          </CardHeader>
          <div className="px-2 sm:px-3">
            <ResultsTable
              rows={rows}
              drawDelays={freshDrawDelays(rows, readAt)}
              renderActions={(row) =>
                row.id !== undefined && (
                  <DeleteTestResultButton id={row.id} name={row.testName ?? ''} />
                )
              }
              empty={
                <>
                  <p className="text-lg font-bold text-ink-950">{t('empty')}</p>
                  <p className="max-w-sm text-[0.9375rem] text-ink-600">{t('empty_text')}</p>
                </>
              }
            />
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            href={(target) => `/dashboard/test-results?page=${target}`}
          />
        </Card>
      </div>
    </>
  );
}
