import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { PageHeader } from '@/components/PageHeader';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { redirect } from '@/libs/I18nNavigation';
import { parseTheme, THEME_COOKIE } from '@/libs/Theme';

type AccountPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AccountPage(props: AccountPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AccountPage' });
  const format = await getFormatter({ locale });

  const { user, unauthorized } = await getCurrentUser();
  if (unauthorized) {
    return endRejectedSession(locale);
  }
  if (!user) {
    return redirect({ href: '/sign-in', locale });
  }

  const jar = await cookies();
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);

  const details = [
    { label: t('email_label'), value: <span className="break-all">{user.email}</span> },
    {
      label: t('role_label'),
      value: <Badge variant="outline">{t(`role_${user.role ?? 'USER'}`)}</Badge>,
    },
    {
      label: t('member_since_label'),
      value: user.createdAt && (
        <time dateTime={user.createdAt}>
          {format.dateTime(new Date(user.createdAt), { dateStyle: 'long' })}
        </time>
      ),
    },
    {
      label: t('id_label'),
      value: <span className="tabular-nums">{user.id}</span>,
    },
    { label: t('theme_label'), value: <ThemeSwitcher theme={theme} /> },
  ];

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Card className="max-w-2xl py-0">
        <dl className="divide-y divide-ink-200">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="grid gap-1.5 px-6 py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-6"
            >
              <dt className="form-label">{detail.label}</dt>
              <dd className="text-[0.9375rem] font-medium text-ink-950">{detail.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </>
  );
}
