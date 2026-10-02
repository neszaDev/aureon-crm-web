/** One language entry of a multi-language field: a language key and its text (or HTML). */
export type LanguageRow = { id: string; key: string; value: string };

/**
 * The rows a new multi-language field starts with (Vue default: Thai and English).
 * @returns Empty Thai and English rows.
 */
export const defaultRows = (): LanguageRow[] => [
  { id: 'row-th', key: 'th', value: '' },
  { id: 'row-en', key: 'en', value: '' },
];

/**
 * Appends an empty row.
 * @param rows Current rows.
 * @param id Id of the new row.
 * @returns The rows with the new one last.
 */
export const addRow = (rows: LanguageRow[], id: string) => [...rows, { id, key: '', value: '' }];

/**
 * Removes one row. With `refillId`, an emptied list gets a fresh Thai row back, so there is
 * always a row to edit (the Vue rich-text editor did this; the plain one could end up empty).
 * @param options Options.
 * @param options.rows Current rows.
 * @param options.id Id of the row to remove.
 * @param options.refillId Id for the replacement row when the last one is removed.
 * @returns The remaining rows.
 */
export const removeRow = (options: { rows: LanguageRow[]; id: string; refillId?: string }) => {
  const rest = options.rows.filter((row) => row.id !== options.id);

  return rest.length === 0 && options.refillId
    ? [{ id: options.refillId, key: 'th', value: '' }]
    : rest;
};

/**
 * Changes the key or value of one row.
 * @param rows Current rows.
 * @param id Id of the row to change.
 * @param patch The new key and/or value.
 * @returns The updated rows.
 */
export const updateRow = (
  rows: LanguageRow[],
  id: string,
  patch: Partial<Omit<LanguageRow, 'id'>>,
) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
