import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { AuthSwitchLink } from '@/components/AuthSwitchLink';
import { SessionExpiredNotice } from '@/components/SessionExpiredNotice';

type SignInPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: SignInPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'SignInPage' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignInPage(props: SignInPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SignInPage' });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink-950">{t('title')}</h1>
        <p className="text-[0.9375rem] leading-relaxed text-ink-600">{t('subtitle')}</p>
      </div>
      <Suspense>
        <SessionExpiredNotice />
      </Suspense>
      <div className="paper p-6 sm:p-7">
        <AuthForm mode="sign-in" />
      </div>
      <p className="text-sm text-ink-600">
        {t('switch_prompt')} <AuthSwitchLink href="/sign-up">{t('switch_link')}</AuthSwitchLink>
      </p>
    </div>
  );
}
