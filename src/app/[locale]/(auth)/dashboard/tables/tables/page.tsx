import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { UserTable } from '@/components/showcase/tables/UserTable';
import { shuffledUsers } from '@/components/showcase/users/data';

export default async function TablesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TablesPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid gap-8 xl:grid-cols-2">
        <DemoCard title={t('simple_title')} description={t('simple_description')}>
          <UserTable users={shuffledUsers()} caption={t('simple_title')} />
        </DemoCard>
        <DemoCard title={t('striped_title')} description={t('striped_description')}>
          <UserTable users={shuffledUsers()} caption={t('striped_title')} striped />
        </DemoCard>
        <DemoCard title={t('condensed_title')} description={t('condensed_description')}>
          <UserTable users={shuffledUsers()} caption={t('condensed_title')} small />
        </DemoCard>
        <DemoCard title={t('bordered_title')} description={t('bordered_description')}>
          <UserTable users={shuffledUsers()} caption={t('bordered_title')} fixed bordered />
        </DemoCard>
      </div>

      <DemoCard title={t('combined_title')} description={t('combined_description')}>
        <UserTable
          users={shuffledUsers()}
          caption={t('combined_title')}
          hover
          striped
          bordered
          small
          fixed
        />
      </DemoCard>

      <DemoCard title={t('combined_dark_title')} description={t('combined_dark_description')}>
        <UserTable
          users={shuffledUsers()}
          caption={t('combined_dark_title')}
          hover
          striped
          bordered
          small
          fixed
          dark
        />
      </DemoCard>
    </>
  );
}
