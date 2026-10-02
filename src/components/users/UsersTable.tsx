import { useFormatter, useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from '@/libs/I18nNavigation';
import type { UserRole } from '@/validations/UserValidation';
import { RoleBadge } from './RoleBadge';

export type UserRow = { id?: number; email?: string; role?: UserRole; createdAt?: string };

/**
 * Users for admins: email (opens the user), role and when they joined.
 * @param props Component props.
 * @param props.rows The users on this page.
 * @returns The table, or a ruled empty row.
 */
export const UsersTable = (props: { rows: UserRow[] }) => {
  const t = useTranslations('UsersPage');
  const format = useFormatter();

  return (
    <Table className="text-sm">
      <TableHeader>
        <TableRow>
          <TableHead className="sm:w-1/2">{t('column_email')}</TableHead>
          <TableHead>{t('column_role')}</TableHead>
          <TableHead className="hidden sm:table-cell">{t('column_member_since')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={3} className="py-8 text-center text-ink-600">
              {t('empty')}
            </TableCell>
          </TableRow>
        ) : (
          props.rows.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="whitespace-normal">
                <Link
                  href={`/dashboard/users/${user.id}`}
                  prefetch={false}
                  className="font-semibold break-all text-ink-950 underline-offset-4 hover:underline"
                >
                  {user.email}
                </Link>
              </TableCell>
              <TableCell>
                <RoleBadge role={user.role} />
              </TableCell>
              <TableCell className="hidden text-ink-600 sm:table-cell">
                {user.createdAt && (
                  <time dateTime={user.createdAt}>
                    {format.dateTime(new Date(user.createdAt), { dateStyle: 'medium' })}
                  </time>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
