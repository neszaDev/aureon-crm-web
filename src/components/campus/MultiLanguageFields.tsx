'use client';

import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { RowButtons } from './RowButtons';
import type { LanguageRow } from './rows';
import { addRow, defaultRows, removeRow, updateRow } from './rows';

/**
 * The rows as the backend stores them (`[{ key, value }]`), for the data preview.
 * @param props Component props.
 * @param props.rows The rows.
 * @returns The preview.
 */
export const RowsPreview = (props: { rows: LanguageRow[] }) => {
  const t = useTranslations('CampusContent');

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-700 uppercase">
        {t('data_title')}
      </p>
      <pre className="max-h-48 overflow-auto rounded-sm border border-ink-200 bg-paper px-3 py-2 font-mono text-xs whitespace-pre-wrap text-ink-700">
        {JSON.stringify(
          props.rows.map((row) => ({ key: row.key, value: row.value })),
          null,
          2,
        )}
      </pre>
    </div>
  );
};

/**
 * Key/value rows for one text in several languages (Vue `MultiLanguage`). With `editable`,
 * each row has add and remove buttons; the list may end up empty, then an add button shows.
 * Needs a `TooltipProvider` above it.
 * @param props Component props.
 * @param props.caption Optional heading above the rows.
 * @param props.editable Whether rows can be added and removed.
 * @returns The rows and a preview of their data.
 */
export const MultiLanguageFields = (props: { caption?: string; editable: boolean }) => {
  const t = useTranslations('CampusContent');
  const [rows, setRows] = useState(defaultRows);

  return (
    <div className="flex flex-col gap-4">
      {props.caption && <h3 className="text-sm font-bold text-ink-950">{props.caption}</h3>}
      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-center"
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
            <InputGroup className="h-10 bg-ply">
              <InputGroupAddon>
                <InputGroupText>{t('value')}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                value={row.value}
                aria-label={t('value_label', { row: index + 1 })}
                onChange={(event) => {
                  setRows(updateRow(rows, row.id, { value: event.target.value }));
                }}
              />
            </InputGroup>
            {props.editable && (
              <RowButtons
                row={index + 1}
                onAdd={() => {
                  setRows(addRow(rows, crypto.randomUUID()));
                }}
                onRemove={() => {
                  setRows(removeRow({ rows, id: row.id }));
                }}
              />
            )}
          </li>
        ))}
      </ul>
      {props.editable && rows.length === 0 && (
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => {
            setRows(addRow(rows, crypto.randomUUID()));
          }}
        >
          <PlusIcon data-icon="inline-start" />
          {t('add')}
        </Button>
      )}
      <RowsPreview rows={rows} />
    </div>
  );
};
