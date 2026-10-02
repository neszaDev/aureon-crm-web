'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { RichTextEditor } from '@/components/RichTextEditor';

/**
 * The text editor demo: the rich text editor and, under it, the HTML it produces as you type.
 * @param props Component props.
 * @param props.content Initial HTML of the document.
 * @returns The editor and its output.
 */
export const TextEditorDemo = (props: { content: string }) => {
  const t = useTranslations('TextEditorsPage');
  const [html, setHtml] = useState(props.content);

  return (
    <div className="flex flex-col gap-6">
      <RichTextEditor content={props.content} label={t('editor_label')} onChange={setHtml} />
      <section aria-labelledby="html-output-heading" className="flex flex-col gap-2">
        <h3
          id="html-output-heading"
          className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-700 uppercase"
        >
          {t('output_title')}
        </h3>
        <pre className="max-h-72 overflow-auto rounded-sm border border-ink-200 bg-ink-100 p-3 font-mono text-[0.8125rem] leading-relaxed break-words whitespace-pre-wrap text-ink-900">
          {html}
        </pre>
      </section>
    </div>
  );
};
