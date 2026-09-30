import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { getCurrentUser } from '@/libs/api/Queries';
import { redirect } from '@/libs/I18nNavigation';

export default async function DashboardPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'DashboardPage' });
  const format = await getFormatter({ locale });

  const { user, unauthorized } = await getCurrentUser();
  if (unauthorized || !user) {
    return redirect({ href: '/sign-in', locale });
  }

  return (
    <div className="[&_p]:my-4">
      <p className="text-xl">{t('hello_message', { email: user.email ?? '' })}</p>
      <p>
        {t('account_details', {
          role: user.role ?? '',
          since: user.createdAt
            ? format.dateTime(new Date(user.createdAt), { dateStyle: 'medium' })
            : '',
        })}
      </p>
    </div>
  );
}
