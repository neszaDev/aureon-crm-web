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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em]">{t('title')}</h1>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{t('subtitle')}</p>
      </div>
      <div className="rounded-lg border border-rule bg-card p-6 shadow-sheet sm:p-7">
        <AuthForm mode="sign-up" />
      </div>
      <p className="text-sm text-muted-foreground">
        {t('switch_prompt')} <AuthSwitchLink href="/sign-in">{t('switch_link')}</AuthSwitchLink>
      </p>
    </div>
  );
}
