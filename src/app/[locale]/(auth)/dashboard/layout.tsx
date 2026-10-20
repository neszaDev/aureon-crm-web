import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Kalam } from 'next/font/google';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { redirect } from '@/libs/I18nNavigation';
import { AppShell } from '@/templates/AppShell';

// The demos' handwritten remarks (`font-hand`), self-hosted by next/font: only these pages carry
// it, and it loads when one draws with it, never preloaded.
const kalam = Kalam({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-kalam',
  display: 'swap',
  preload: false,
});

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
  if (unauthorized) {
    return endRejectedSession(locale);
  }
  if (!user) {
    return redirect({ href: '/sign-in', locale });
  }

  // Every message, for the demos' client components (the root layout passes the public pages').
  return (
    <NextIntlClientProvider>
      <div className={`${kalam.variable} contents`}>
        <AppShell email={user.email} isAdmin={user.role === 'ADMIN'}>
          {props.children}
        </AppShell>
      </div>
    </NextIntlClientProvider>
  );
}
