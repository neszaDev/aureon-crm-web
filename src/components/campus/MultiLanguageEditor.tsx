'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { RichTextEditor } from '@/components/RichTextEditor';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { RowsPreview } from './MultiLanguageFields';
import { RowButtons } from './RowButtons';
import { addRow, defaultRows, removeRow, updateRow } from './rows';

/**
 * A language key and a rich-text editor per row (Vue `MLEditor`). With `editable`, rows can
 * be added and removed; removing the last one brings back an empty Thai row.
 * Needs a `TooltipProvider` above it.
 * @param props Component props.
 * @param props.caption Heading above the rows.
 * @param props.editable Whether rows can be added and removed.
 * @returns The rows and a preview of their data.
 */
export const MultiLanguageEditor = (props: { caption: string; editable: boolean }) => {
  const t = useTranslations('CampusContent');
  const [rows, setRows] = useState(defaultRows);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-ink-950">{props.caption}</h3>
      <ul className="flex flex-col gap-5">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-start"
          >
            <InputGroup className="h-10 bg-ply">
              <InputGroupAddon>
                <InputGroupText>{t('key')}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                value={row.key}
                aria-label={t('key_label', { row: index + 1 })}
                onChange={(event) => {
                  setRows(updateRow(rows, row.id, { key: event.target.value }));
                }}
              />
            </InputGroup>
            <RichTextEditor
              label={t('text_label', { row: index + 1 })}
              content={row.value}
              size="sm"
              onChange={(html) => {
                setRows((current) => updateRow(current, row.id, { value: html }));
              }}
            />
            {props.editable && (
              <RowButtons
                row={index + 1}
                onAdd={() => {
                  setRows(addRow(rows, crypto.randomUUID()));
                }}
                onRemove={() => {
                  setRows(removeRow({ rows, id: row.id, refillId: crypto.randomUUID() }));
                }}
              />
            )}
          </li>
        ))}
      </ul>
      <RowsPreview rows={rows} />
    </div>
  );
};
