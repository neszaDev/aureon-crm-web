// Cells a spreadsheet would run as a formula; prefixed so the export stays plain data.
const FORMULA_START = /^[=+\-@\t\r]/u;
const NEEDS_QUOTES = /[",\n\r]/u;

const csvCell = (value: string | number) => {
  if (typeof value === 'number') {
    return String(value);
  }
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

/**
 * Serialises rows as CSV (RFC 4180 quoting), the first row being the header.
 * @param rows Rows of cells.
 * @returns The CSV text, lines separated by CRLF.
 */
export const toCsv = (rows: (string | number)[][]) =>
  rows.map((row) => row.map(csvCell).join(',')).join('\r\n');

/**
 * Saves CSV text as a file in the browser.
 * @param options Download options.
 * @param options.csv The CSV text.
 * @param options.filename Name of the saved file.
 */
export const downloadCsv = (options: { csv: string; filename: string }) => {
  // The BOM lets spreadsheet apps read accented names as UTF-8.
  const blob = new Blob(['﻿', options.csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = options.filename;
  link.click();
  URL.revokeObjectURL(url);
};
