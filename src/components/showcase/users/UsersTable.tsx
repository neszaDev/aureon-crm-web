'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { DataTable, initialQuery } from '@/components/showcase/tables/DataTable';
import { Link, useRouter } from '@/libs/I18nNavigation';
import type { User } from './data';
import { USERS, USERS_PAGE_SIZE } from './data';
import { useUserColumns, userRowClassName } from './useUserColumns';

/**
 * The Vue users list: striped rows that open the user, five per page, with the page kept in
 * `?page=` so links, reloads and the back button land on the same page.
 * @returns The users table.
 */
export const UsersTable = () => {
  const t = useTranslations('UsersTable');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pages = Math.ceil(USERS.length / USERS_PAGE_SIZE);
  const page = Math.min(Math.max(Math.trunc(Number(searchParams.get('page'))) || 1, 1), pages);
  const columns = useUserColumns().map((column) =>
    column.id === 'username'
      ? {
          ...column,
          header: t('column_name'),
          cell: (user: User) => (
            <Link
              href={`/dashboard/users/${user.id}`}
              className="font-semibold text-ink-950 underline-offset-4 hover:underline"
            >
              {user.username}
            </Link>
          ),
        }
      : column,
  );

  return (
    <DataTable
      data={USERS}
      columns={columns}
      getRowId={(user) => String(user.id)}
      caption={t('caption')}
      striped
      query={{ ...initialQuery(USERS_PAGE_SIZE), pageIndex: page - 1 }}
      // A shallow URL update: Next.js keeps `useSearchParams` in sync with pushState.
      onQueryChange={(next) => {
        window.history.pushState(null, '', `?page=${next.pageIndex + 1}`);
      }}
      onRowClick={(user) => {
        router.push(`/dashboard/users/${user.id}`);
      }}
      rowClassName={userRowClassName}
      pagination={{ doubleArrows: false, align: 'center' }}
    />
  );
};
