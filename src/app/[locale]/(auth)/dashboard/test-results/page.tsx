import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { DeleteTestResultButton } from '@/components/DeleteTestResultButton';
import { TestResultForm } from '@/components/TestResultForm';
import { listTestResults } from '@/libs/api/Queries';
import { Link, redirect } from '@/libs/I18nNavigation';

const PAGE_SIZE = 10;

type TestResultsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function TestResultsPage(props: TestResultsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TestResultsPage' });
  const tStatus = await getTranslations({ locale, namespace: 'TestResultForm' });
  const format = await getFormatter({ locale });
  const searchParams = await props.searchParams;
  const page = Math.max(Math.trunc(Number(searchParams.page ?? '0')) || 0, 0);

  const { results, summary, unauthorized } = await listTestResults(page, PAGE_SIZE);
  if (unauthorized) {
    return redirect({ href: '/sign-in', locale });
  }

  const rows = results?.content ?? [];
  const totalPages = results?.totalPages ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="mb-3 text-xl font-bold text-gray-900">
          {t('summary_title', { total: summary?.total ?? 0 })}
        </h2>
        <ul className="flex gap-6">
          {(summary?.byStatus ?? []).map((entry) => (
            <li key={entry.status} data-testid={`summary-${entry.status}`}>
              {tStatus(`status_${entry.status ?? 'PENDING'}`)}:{' '}
              <span className="font-bold">{entry.count ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="create-heading">
        <h2 id="create-heading" className="mb-3 text-xl font-bold text-gray-900">
          {t('create_title')}
        </h2>
        <TestResultForm />
      </section>

      <section aria-labelledby="list-heading">
        <h2 id="list-heading" className="mb-3 text-xl font-bold text-gray-900">
          {t('list_title')}
        </h2>
        {rows.length === 0 ? (
          <p>{t('empty')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">{t('column_name')}</th>
                <th>{t('column_status')}</th>
                <th>{t('column_score')}</th>
                <th>{t('column_tested_at')}</th>
                <th>
                  <span className="sr-only">{t('column_actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="py-2">{row.testName}</td>
                  <td>{tStatus(`status_${row.status ?? 'PENDING'}`)}</td>
                  <td>{format.number(row.score ?? 0)}</td>
                  <td>
                    {row.testedAt
                      ? format.dateTime(new Date(row.testedAt), {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : ''}
                  </td>
                  <td className="text-right">
                    {row.id !== undefined && (
                      <DeleteTestResultButton id={row.id} name={row.testName ?? ''} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <nav className="mt-4 flex gap-4 text-sm" aria-label={t('pagination_label')}>
            {page > 0 && (
              <Link href={`/dashboard/test-results?page=${page - 1}`}>{t('previous_page')}</Link>
            )}
            <span>{t('page_of', { page: page + 1, total: totalPages })}</span>
            {page + 1 < totalPages && (
              <Link href={`/dashboard/test-results?page=${page + 1}`}>{t('next_page')}</Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
