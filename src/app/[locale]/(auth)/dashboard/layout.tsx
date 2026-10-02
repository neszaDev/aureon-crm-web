import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCurrentUser } from '@/libs/api/Queries';
import { redirect } from '@/libs/I18nNavigation';
import { AppShell } from '@/templates/AppShell';

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: DashboardLayoutProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'DashboardLayout' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

// Every page below is personal: never prerender or cache it.
export const dynamic = 'force-dynamic';

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const { user, unauthorized } = await getCurrentUser();
  if (unauthorized || !user) {
    return redirect({ href: '/sign-in', locale });
  }

  return (
    <AppShell email={user.email} isAdmin={user.role === 'ADMIN'}>
      {props.children}
    </AppShell>
  );
}
