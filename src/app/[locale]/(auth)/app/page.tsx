import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/libs/api/Queries';
import { Link, redirect } from '@/libs/I18nNavigation';

type AppPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: AppPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'AppPage' });

  return { title: t('title') };
}

// Personal: never prerender or cache it.
export const dynamic = 'force-dynamic';

// shortcut: a placeholder so sign-in has a real target; Task 4 replaces it with the CRM home.
export default async function AppPage(props: AppPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AppPage' });

  const { user, unauthorized } = await getCurrentUser();
  if (unauthorized || !user) {
    return redirect({ href: '/sign-in', locale });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-6 px-4">
      <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink-950">{t('title')}</h1>
      <Button asChild>
        <Link href="/dashboard/">{t('dashboard_link')}</Link>
      </Button>
    </main>
  );
}
