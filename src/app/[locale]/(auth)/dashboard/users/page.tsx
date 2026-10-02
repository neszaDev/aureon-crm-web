import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminOnlyNotice } from '@/components/users/AdminOnlyNotice';
import { UserSearchForm } from '@/components/users/UserSearchForm';
import { UsersTable } from '@/components/users/UsersTable';
import { listUsers } from '@/libs/api/Queries';
import { redirect } from '@/libs/I18nNavigation';

const PAGE_SIZE = 20;

type UsersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function UsersPage(props: UsersPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'UsersPage' });
  const searchParams = await props.searchParams;
  const page = Math.max(Math.trunc(Number(searchParams.page ?? '0')) || 0, 0);
  const query = (searchParams.q ?? '').trim().slice(0, 254);

  const { users, forbidden, unauthorized } = await listUsers({ query, page, size: PAGE_SIZE });
  if (unauthorized) {
    return redirect({ href: '/sign-in', locale });
  }

  if (forbidden) {
    return (
      <>
        <PageHeader title={t('title')} description={t('description')} />
        <AdminOnlyNotice />
      </>
    );
  }

  const search = query ? `&q=${encodeURIComponent(query)}` : '';

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description_count', { count: users?.totalElements ?? 0 })}
      />

      <UserSearchForm query={query} />

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5">
          <CardTitle>
            <h2>{query ? t('results_title', { query }) : t('list_title')}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          <UsersTable rows={users?.content ?? []} />
        </CardContent>
        <Pagination
          page={page}
          totalPages={users?.totalPages ?? 0}
          href={(target) => `/dashboard/users?page=${target}${search}`}
        />
      </Card>
    </>
  );
}
