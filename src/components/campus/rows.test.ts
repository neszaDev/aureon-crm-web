import { describe, expect, it } from 'vitest';
import { addRow, defaultRows, removeRow, updateRow } from './rows';

describe('multi-language rows', () => {
  it('appends an empty row', () => {
    expect(addRow(defaultRows(), 'new').at(-1)).toStrictEqual({ id: 'new', key: '', value: '' });
  });

  it('removes only the chosen row, even when keys repeat', () => {
    const rows = [...defaultRows(), { id: 'row-th-2', key: 'th', value: 'ซ้ำ' }];

    expect(removeRow({ rows, id: 'row-th' }).map((row) => row.id)).toStrictEqual([
      'row-en',
      'row-th-2',
    ]);
  });

  it('leaves the list empty without a refill id', () => {
    expect(
      removeRow({ rows: [{ id: 'row-th', key: 'th', value: '' }], id: 'row-th' }),
    ).toStrictEqual([]);
  });

  it('puts a Thai row back when the last row is removed with a refill id', () => {
    expect(
      removeRow({
        rows: [{ id: 'row-en', key: 'en', value: '' }],
        id: 'row-en',
        refillId: 'fresh',
      }),
    ).toStrictEqual([{ id: 'fresh', key: 'th', value: '' }]);
  });

  it('updates the key and value of one row', () => {
    expect(updateRow(defaultRows(), 'row-en', { value: 'Hello' })[1]).toStrictEqual({
      id: 'row-en',
      key: 'en',
      value: 'Hello',
    });
  });
});
