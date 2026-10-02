import { ArrowLeftIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from '@/libs/I18nNavigation';
import type { User } from './data';
import { USERS_PAGE_SIZE } from './data';
import { UserStatusMark } from './UserStatusMark';

/**
 * The Vue user page: the user's fields as a striped, condensed table, and a back button to the
 * list page that holds the user. An unknown id shows a "not found" row instead.
 * @param props Component props.
 * @param props.id The id from the URL.
 * @param props.user The user, when the id matches one.
 * @returns The user card.
 */
export const UserDetailCard = (props: { id: string; user?: User }) => {
  const t = useTranslations('UserPage');
  const tUsers = useTranslations('UsersTable');
  const format = useFormatter();
  const { user } = props;
  const listPage = user ? Math.ceil(user.id / USERS_PAGE_SIZE) : 1;
  const fields: [string, React.ReactNode][] = user
    ? [
        [
          t('field_registered'),
          <time key="registered" dateTime={user.registered} className="tabular-nums">
            {format.dateTime(new Date(`${user.registered}T00:00:00Z`), {
              dateStyle: 'long',
              timeZone: 'UTC',
            })}
          </time>,
        ],
        [t('field_role'), tUsers(`role_${user.role}`)],
        [t('field_status'), <UserStatusMark key="status" status={user.status} />],
      ]
    : [[t('field_id'), t('not_found')]];

  return (
    <Card className="gap-0 pb-0 lg:max-w-xl">
      <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5">
        <CardTitle>
          <h2>{t('card_title', { id: props.id })}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 py-2 sm:px-3">
        <Table className="table-fixed [&_tbody>tr:nth-child(odd)]:bg-ink-100/45 [&_td]:py-1.5 [&_th]:h-8">
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/5">{user?.username ?? t('not_found')}</TableHead>
              <TableHead>
                <span className="sr-only">{t('value_column')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map(([label, value]) => (
              <TableRow key={label} className="hover:bg-transparent">
                <TableCell className="font-semibold text-ink-700">{label}</TableCell>
                <TableCell className="whitespace-normal">{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link href={listPage > 1 ? `/dashboard/users?page=${listPage}` : '/dashboard/users'}>
            <ArrowLeftIcon data-icon="inline-start" />
            {t('back')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
