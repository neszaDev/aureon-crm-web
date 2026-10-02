import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthForm } from '@/components/AuthForm';
import { Link } from '@/libs/I18nNavigation';

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
      <div className="paper p-6 sm:p-7">
        <AuthForm mode="sign-in" />
      </div>
      <p className="text-sm text-ink-600">
        {t('switch_prompt')}{' '}
        <Link
          href="/sign-up/"
          className="font-semibold text-folder underline decoration-folder/40 underline-offset-4 hover:decoration-folder"
        >
          {t('switch_link')}
        </Link>
      </p>
    </div>
  );
}
