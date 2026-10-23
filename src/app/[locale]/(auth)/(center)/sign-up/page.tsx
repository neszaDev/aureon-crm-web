import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthForm } from '@/components/AuthForm';
import { AuthSwitchLink } from '@/components/AuthSwitchLink';

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: SignUpPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'SignUpPage' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignUpPage(props: SignUpPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SignUpPage' });

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl leading-tight font-semibold tracking-[-0.01em]">{t('title')}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('subtitle')}</p>
      </div>
      <AuthForm mode="sign-up" />
      <p className="border-t border-rule pt-6 text-sm text-muted-foreground">
        {t('switch_prompt')} <AuthSwitchLink href="/sign-in">{t('switch_link')}</AuthSwitchLink>
      </p>
    </div>
  );
}
