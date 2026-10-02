import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { TextEditorDemo } from '@/components/showcase/editors/TextEditorDemo';
import { DocsLink } from '@/components/showcase/forms/DocsLink';

const link = (href: string) => (chunks: string) => `<a href="${href}">${chunks}</a>`;

export default async function TextEditorsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TextEditorsPage' });

  // The sample document, as HTML for the editor (the Vue page bound a Wikipedia-style article).
  const content = [
    `<p>${t.markup('article_intro', {
      b: (chunks) => `<strong>${chunks}</strong>`,
      school: link(t('link_school')),
      grade: link(t('link_grade')),
    })}</p>`,
    `<p>${t('article_terms')}</p>`,
    `<p>${t('article_quote_intro')}</p>`,
    `<blockquote><p>${t('article_quote')}</p></blockquote>`,
    `<p>${t.markup('article_layout', { i: (chunks) => `<em>${chunks}</em>` })}</p>`,
  ].join('');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DemoCard
        title={t('card_title')}
        description={t('card_description')}
        action={
          <DocsLink
            href="https://tiptap.dev/docs/editor"
            label={t('docs')}
            title={t('docs_title')}
          />
        }
      >
        <TextEditorDemo content={content} />
      </DemoCard>
    </>
  );
}
