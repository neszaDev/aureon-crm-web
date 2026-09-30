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
    <>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('title')}</h1>
      <AuthForm mode="sign-in" />
      <p className="mt-6 text-sm text-gray-700">
        {t('switch_prompt')}{' '}
        <Link href="/sign-up/" className="text-blue-700 hover:underline">
          {t('switch_link')}
        </Link>
      </p>
    </>
  );
}
