import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { DocsLink } from '@/components/showcase/forms/DocsLink';
import { SignUpValidationForm } from '@/components/showcase/forms/SignUpValidationForm';

const ExternalLink = (props: { href: string; children: React.ReactNode }) => (
  <a
    href={props.href}
    target="_blank"
    rel="noreferrer noopener"
    className="font-semibold text-folder underline-offset-4 hover:underline"
  >
    {props.children}
  </a>
);

export default async function ValidationFormsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ValidationFormsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard
        title={t('card_title')}
        description={t.rich('intro', {
          rhf: (chunks) => <ExternalLink href="https://react-hook-form.com">{chunks}</ExternalLink>,
          zod: (chunks) => <ExternalLink href="https://zod.dev">{chunks}</ExternalLink>,
        })}
        action={
          <DocsLink
            href="https://react-hook-form.com/docs/useform"
            label={t('docs')}
            title={t('docs_title')}
          />
        }
      >
        <SignUpValidationForm />
      </DemoCard>
    </>
  );
}
