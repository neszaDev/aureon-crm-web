import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe(toCsv, () => {
  it('joins cells with commas and rows with CRLF', () => {
    expect(
      toCsv([
        ['Name', 'Score'],
        ['Ada', 36],
      ]),
    ).toBe('Name,Score\r\nAda,36');
  });

  it('quotes cells holding commas, quotes or line breaks', () => {
    expect(toCsv([['Smith, Jane', 'say "hi"', 'two\nlines']])).toBe(
      '"Smith, Jane","say ""hi""","two\nlines"',
    );
  });

  it('defuses cells a spreadsheet would run as a formula', () => {
    expect(toCsv([['=SUM(A1:A2)', '@cmd', -4]])).toBe("'=SUM(A1:A2),'@cmd,-4");
  });
});
