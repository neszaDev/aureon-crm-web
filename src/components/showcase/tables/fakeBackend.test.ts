import { describe, expect, it } from 'vitest';
import type { DataColumn } from './DataTable';
import { initialQuery } from './DataTable';
import { queryRows } from './fakeBackend';

type Pupil = { name: string; house: string; age: number };

const rows: Pupil[] = [
  { name: 'Ada', house: 'Oak', age: 12 },
  { name: 'Ben', house: 'Elm', age: 9 },
  { name: 'Cleo', house: 'Oak', age: 10 },
  { name: 'Dev', house: 'Ash', age: 11 },
];
const columns: DataColumn<Pupil>[] = [
  { id: 'name', header: 'Name', value: (pupil) => pupil.name },
  { id: 'house', header: 'House', value: (pupil) => pupil.house },
  { id: 'age', header: 'Age', value: (pupil) => pupil.age },
];
const names = (result: { rows: Pupil[] }) => result.rows.map((pupil) => pupil.name);

describe(queryRows, () => {
  it('returns the requested page with the total of matching rows', () => {
    const result = queryRows({ rows, columns, query: { ...initialQuery(3), pageIndex: 1 } });

    expect(names(result)).toStrictEqual(['Dev']);
    expect(result.total).toBe(4);
  });

  it('filters every column with the table filter, ignoring case', () => {
    const result = queryRows({ rows, columns, query: { ...initialQuery(5), globalFilter: 'oAk' } });

    expect(names(result)).toStrictEqual(['Ada', 'Cleo']);
  });

  it('combines column filters with each other', () => {
    const query = {
      ...initialQuery(5),
      columnFilters: [
        { id: 'house', value: 'oak' },
        { id: 'name', value: 'c' },
      ],
    };

    expect(names(queryRows({ rows, columns, query }))).toStrictEqual(['Cleo']);
  });

  it('sorts numbers numerically in either direction', () => {
    const query = { ...initialQuery(5), sorting: [{ id: 'age', desc: true }] };

    expect(names(queryRows({ rows, columns, query }))).toStrictEqual(['Ada', 'Dev', 'Cleo', 'Ben']);
  });
});
