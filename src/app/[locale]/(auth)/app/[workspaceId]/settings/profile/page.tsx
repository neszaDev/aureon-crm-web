import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { changePassword, updateProfile } from '@/actions/ProfileActions';
import { PasswordForm } from '@/components/crm/settings/PasswordForm';
import { ProfileForm } from '@/components/crm/settings/ProfileForm';
import { SettingsHeader, SettingsSection } from '@/components/crm/settings/SettingsHeader';
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
  if (!user) {
    throw new Error('Could not load your profile');
  }

  return (
    <>
      <SettingsHeader title={t('title')} description={t('description')} />
      {/* Side by side on wide screens: two short forms, the page in one view. */}
      <div className="grid items-start gap-x-10 gap-y-6 xl:grid-cols-2">
        <SettingsSection headingId="profile-heading" title={t('profile_heading')}>
          <div className="max-w-xl">
            <ProfileForm
              userId={user.id}
              email={user.email}
              displayName={user.displayName}
              action={updateProfile}
            />
          </div>
        </SettingsSection>
        <SettingsSection
          headingId="password-heading"
          title={t('password_heading')}
          description={t('password_text')}
        >
          <div className="max-w-xl">
            <PasswordForm action={changePassword} />
          </div>
        </SettingsSection>
      </div>
    </>
  );
}
