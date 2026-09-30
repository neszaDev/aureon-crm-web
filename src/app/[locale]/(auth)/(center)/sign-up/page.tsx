import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthForm } from '@/components/AuthForm';
import { Link } from '@/libs/I18nNavigation';

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
    <>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('title')}</h1>
      <AuthForm mode="sign-up" />
      <p className="mt-6 text-sm text-gray-700">
        {t('switch_prompt')}{' '}
        <Link href="/sign-in/" className="text-blue-700 hover:underline">
          {t('switch_link')}
        </Link>
      </p>
    </>
  );
}
