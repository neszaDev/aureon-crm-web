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
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl leading-tight font-semibold tracking-[-0.01em]">{t('title')}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('subtitle')}</p>
      </div>
      <Suspense>
        <SessionExpiredNotice />
      </Suspense>
      <AuthForm mode="sign-in" />
      <p className="border-t border-rule pt-6 text-sm text-muted-foreground">
        {t('switch_prompt')} <AuthSwitchLink href="/sign-up">{t('switch_link')}</AuthSwitchLink>
      </p>
    </div>
  );
}
