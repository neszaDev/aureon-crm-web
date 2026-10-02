import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminOnlyNotice } from '@/components/users/AdminOnlyNotice';
import { DeleteUserButton } from '@/components/users/DeleteUserButton';
import { EditUserForm } from '@/components/users/EditUserForm';
import { RoleBadge } from '@/components/users/RoleBadge';
import { getCurrentUser, getUser } from '@/libs/api/Queries';
import { Link, redirect } from '@/libs/I18nNavigation';

type UserPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function UserPage(props: UserPageProps) {
  const { locale, id: rawId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'UserPage' });
  const format = await getFormatter({ locale });
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) {
    notFound();
  }

  const [{ user, forbidden, unauthorized }, { user: me }] = await Promise.all([
    getUser(id),
    getCurrentUser(),
  ]);
  if (unauthorized) {
    return redirect({ href: '/sign-in', locale });
  }
  if (forbidden) {
    return (
      <>
        <PageHeader title={t('title')} />
        <AdminOnlyNotice />
      </>
    );
  }
  if (!user?.id || !user.email) {
    notFound();
  }
  const isSelf = me?.id === user.id;

  return (
    <>
      <PageHeader
        title={<span className="break-all">{user.email}</span>}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <RoleBadge role={user.role} />
            {user.createdAt &&
              t('member_since', {
                date: format.dateTime(new Date(user.createdAt), { dateStyle: 'long' }),
              })}
          </span>
        }
        actions={
          <Link
            href="/dashboard/users"
            className="text-sm font-medium text-ink-700 underline-offset-4 hover:underline"
          >
            {t('back')}
          </Link>
        }
      />

      {isSelf ? (
        <Card className="max-w-2xl">
          <CardContent className="text-[0.9375rem] text-ink-600">{t('self_notice')}</CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card>
            <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5">
              <CardTitle>
                <h2>{t('edit_title')}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditUserForm
                id={user.id}
                defaults={{ email: user.email, role: user.role ?? 'USER' }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5">
              <CardTitle>
                <h2>{t('delete_title')}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4">
              <p className="text-[0.9375rem] text-ink-600">{t('delete_text')}</p>
              <DeleteUserButton id={user.id} email={user.email} />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
