import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { CodeEditorDemo } from '@/components/showcase/editors/CodeEditorDemo';
import { DocsLink } from '@/components/showcase/forms/DocsLink';

export default async function CodeEditorsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CodeEditorsPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard
        title={t('card_title')}
        description={t('card_description')}
        action={
          <DocsLink
            href="https://uiwjs.github.io/react-codemirror/"
            label={t('docs')}
            title={t('docs_title')}
          />
        }
      >
        <CodeEditorDemo />
      </DemoCard>
    </>
  );
}
