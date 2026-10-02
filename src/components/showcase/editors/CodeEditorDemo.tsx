'use client';

import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { CodeLanguage } from './data';
import { CODE_LANGUAGES, CODE_SAMPLES } from './data';

const EDITOR_THEMES = ['paper', 'night'] as const;

type EditorTheme = (typeof EDITOR_THEMES)[number];

// The light theme is drawn from the Marksheet tokens: a white ply page, card-stock gutter,
// navy ink and a folder-green caret. The dark one is CodeMirror's bundled One Dark.
const paperTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--ply)',
    color: 'var(--ink-900)',
    fontSize: '0.875rem',
  },
  '.cm-scroller': { fontFamily: 'var(--font-mono, monospace)' },
  '.cm-content': { caretColor: 'var(--folder)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--folder)' },
  '.cm-gutters': {
    backgroundColor: 'var(--paper-card)',
    color: 'var(--ink-400)',
    borderRight: '1px solid var(--ink-200)',
  },
  '.cm-activeLine': { backgroundColor: 'var(--paper-card)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--ink-100)', color: 'var(--ink-700)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--ink-200)',
  },
  '&.cm-focused': { outline: 'none' },
});

const LANGUAGE_EXTENSIONS = {
  markdown: () => markdown(),
  javascript: () => javascript(),
  html: () => html(),
} satisfies Record<CodeLanguage, unknown>;

const isLanguage = (value: string): value is CodeLanguage => value in LANGUAGE_EXTENSIONS;
const isTheme = (value: string): value is EditorTheme =>
  EDITOR_THEMES.some((theme) => theme === value);

/**
 * A CodeMirror editor with line numbers, active-line highlight and wrapping, plus selects for
 * its theme (Marksheet paper or One Dark) and language (Markdown, JavaScript or HTML). Changing
 * the language loads that language's sample; changing the theme keeps your edits.
 * @returns The editor and its controls.
 */
export const CodeEditorDemo = () => {
  const t = useTranslations('CodeEditorsPage');
  const [language, setLanguage] = useState<CodeLanguage>('html');
  const [theme, setTheme] = useState<EditorTheme>('paper');

  return (
    <div className="flex flex-col gap-4">
      <div className="min-h-[50vh] overflow-hidden rounded-md border border-ink-300 shadow-ply">
        <CodeMirror
          value={CODE_SAMPLES[language]}
          height="50vh"
          autoFocus
          theme={theme === 'paper' ? paperTheme : 'dark'}
          basicSetup={{ tabSize: 4, lineNumbers: true, highlightActiveLine: true }}
          extensions={[
            LANGUAGE_EXTENSIONS[language](),
            EditorView.lineWrapping,
            EditorView.contentAttributes.of({ 'aria-label': t('editor_label') }),
          ]}
        />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="code-theme">{t('theme_label')}</Label>
          <NativeSelect
            id="code-theme"
            size="sm"
            value={theme}
            onChange={(event) => {
              const next = event.currentTarget.value;
              if (isTheme(next)) {
                setTheme(next);
              }
            }}
          >
            {EDITOR_THEMES.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {t(`theme_${option}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="code-language">{t('language_label')}</Label>
          <NativeSelect
            id="code-language"
            size="sm"
            value={language}
            onChange={(event) => {
              const next = event.currentTarget.value;
              if (isLanguage(next)) {
                setLanguage(next);
              }
            }}
          >
            {CODE_LANGUAGES.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {t(`language_${option}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
    </div>
  );
};
