import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AccountMenu } from '@/components/campus/AccountMenu';
import { AppLauncher } from '@/components/campus/AppLauncher';
import { CampusDialogs } from '@/components/campus/CampusDialogs';
import { launcherCategories } from '@/components/campus/data';
import { ProfileCard } from '@/components/campus/ProfileCard';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { getCampusProfile } from '@/libs/api/Queries';

export default async function CampusPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CampusPage' });
  const profile = await getCampusProfile();

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="launcher-heading" className="flex flex-col gap-4">
          <h2 id="launcher-heading" className="text-lg font-bold tracking-[-0.01em] text-ink-950">
            {t('launcher_title')}
          </h2>
          <AppLauncher categories={launcherCategories} />
        </section>
        <ProfileCard profile={profile} />
      </div>

      <DemoCard title={t('dialogs_title')} description={t('dialogs_description')}>
        <CampusDialogs email={profile.email} />
      </DemoCard>

      <DemoCard title={t('account_title')} description={t('account_description')}>
        <AccountMenu name={profile.name} email={profile.email} avatar={profile.avatar} />
      </DemoCard>
    </>
  );
}
