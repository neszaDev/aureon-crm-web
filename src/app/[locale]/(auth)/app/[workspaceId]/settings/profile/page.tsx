import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { changePassword, updateProfile } from '@/actions/ProfileActions';
import { PasswordForm } from '@/components/crm/settings/PasswordForm';
import { ProfileForm } from '@/components/crm/settings/ProfileForm';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { getCurrentUser } from '@/libs/api/Queries';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';

type ProfilePageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

export async function generateMetadata(props: ProfilePageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'ProfilePage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function ProfilePage(props: ProfilePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ProfilePage' });

  // The layout has loaded the user (a cached call) and handled its failures.
  const { user } = await getCurrentUser();
  if (!user?.email) {
    throw new Error('Could not load your profile');
  }

  return (
    <>
      <SettingsHeader title={t('title')} description={t('description')} />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section
          aria-labelledby="profile-heading"
          className="rounded-lg border border-rule bg-card p-5 sm:p-6"
        >
          <h2 id="profile-heading" className="mb-4 font-semibold">
            {t('profile_heading')}
          </h2>
          <ProfileForm email={user.email} displayName={user.displayName} action={updateProfile} />
        </section>
        <section
          aria-labelledby="password-heading"
          className="rounded-lg border border-rule bg-card p-5 sm:p-6"
        >
          <h2 id="password-heading" className="font-semibold">
            {t('password_heading')}
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">{t('password_text')}</p>
          <PasswordForm action={changePassword} />
        </section>
      </div>
    </>
  );
}
