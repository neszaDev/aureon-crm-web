import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { findUser } from '@/components/showcase/users/data';
import { UserDetailCard } from '@/components/showcase/users/UserDetailCard';

export default async function UserPage(props: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'UserPage' });
  const user = findUser(id);

  return (
    <>
      <PageHeader title={user?.username ?? t('title')} description={t('description')} />

      <UserDetailCard id={id} user={user} />
    </>
  );
}
