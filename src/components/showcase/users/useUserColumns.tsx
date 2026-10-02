import { useFormatter, useTranslations } from 'next-intl';
import type { DataColumn } from '@/components/showcase/tables/DataTable';
import type { User } from './data';
import { UserStatusMark } from './UserStatusMark';

/** The Vue field widths of the advanced tables: name 40%, role and status 20% each. */
export const VUE_COLUMN_WIDTHS = { username: 'w-2/5', role: 'w-1/5', status: 'w-1/5' };

/**
 * The columns the Vue tables show for a user: name, registered, role and status.
 * Sorting and filters use the localized role and status names, as the reader sees them.
 * @param options Column options.
 * @param options.nameClassName Classes for the name cells (the Vue users list sets them bold).
 * @param options.widths Width classes per column.
 * @returns The data table columns.
 */
export const useUserColumns = (options?: {
  nameClassName?: string;
  widths?: Partial<Record<'username' | 'role' | 'status', string>>;
}): DataColumn<User>[] => {
  const t = useTranslations('UsersTable');
  const format = useFormatter();

  return [
    {
      id: 'username',
      header: t('column_username'),
      value: (user) => user.username,
      className: options?.widths?.username,
      cell: options?.nameClassName
        ? (user) => <span className={options.nameClassName}>{user.username}</span>
        : undefined,
    },
    {
      id: 'registered',
      header: t('column_registered'),
      // ISO days sort in calendar order; the cell shows the localized date.
      value: (user) => user.registered,
      cell: (user) => (
        <time dateTime={user.registered} className="tabular-nums">
          {format.dateTime(new Date(`${user.registered}T00:00:00Z`), {
            dateStyle: 'medium',
            timeZone: 'UTC',
          })}
        </time>
      ),
    },
    {
      id: 'role',
      header: t('column_role'),
      value: (user) => t(`role_${user.role}`),
      className: options?.widths?.role,
    },
    {
      id: 'status',
      header: t('column_status'),
      value: (user) => t(`status_${user.status}`),
      className: options?.widths?.status,
      cell: (user) => <UserStatusMark status={user.status} />,
    },
  ];
};

/**
 * The Vue `_classes` row tints, in Marksheet tokens.
 * @param user The row's user.
 * @returns Row classes, or `undefined` for a plain row.
 */
export const userRowClassName = (user: User) => {
  if (user.highlight === 'success') {
    return 'bg-pass/10!';
  }
  return user.highlight === 'danger' ? 'bg-pen/6!' : undefined;
};
