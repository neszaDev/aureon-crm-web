'use client';

import { UploadIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

/**
 * A file input drawn as a ply field: the chosen file names (or a prompt) and a browse tag. The
 * native input stays in the page (visually hidden) so it keeps the keyboard and form behaviour.
 * @param props Component props.
 * @param props.id Id of the native input, for its label.
 * @param props.multiple Accept several files.
 * @returns The file field.
 */
export const CustomFileInput = (props: { id: string; multiple?: boolean }) => {
  const t = useTranslations('BasicFormsPage');
  const [names, setNames] = useState<string[]>([]);
  const summaryId = `${props.id}-files`;

  let summary = props.multiple ? t('choose_files') : t('choose_file');
  if (names.length === 1) {
    summary = names[0] ?? summary;
  } else if (names.length > 1) {
    summary = t('files_selected', { count: names.length });
  }

  return (
    <div className="relative">
      <input
        id={props.id}
        type="file"
        multiple={props.multiple}
        className="peer sr-only"
        aria-describedby={summaryId}
        onChange={(event) => {
          setNames([...(event.currentTarget.files ?? [])].map((file) => file.name));
        }}
      />
      <label
        htmlFor={props.id}
        aria-hidden="true"
        className="flex h-10 cursor-pointer items-center overflow-hidden rounded-md border border-input bg-ply text-[0.9375rem] shadow-ply transition-[border-color,box-shadow] peer-focus-visible:border-folder peer-focus-visible:ring-3 peer-focus-visible:ring-folder/20 hover:border-ink-400"
      >
        <span
          id={summaryId}
          className={
            names.length > 0
              ? 'flex-1 truncate px-3 text-ink-900'
              : 'flex-1 truncate px-3 text-ink-400'
          }
        >
          {summary}
        </span>
        <span className="flex h-full items-center gap-1.5 border-l border-ink-300 bg-paper-card px-3 text-sm font-semibold text-ink-700">
          <UploadIcon aria-hidden="true" className="size-4" />
          {t('browse')}
        </span>
      </label>
    </div>
  );
};
