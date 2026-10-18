import { describe, expect, it } from 'vitest';
import type { ListSpec } from './ListQuery';
import { isFiltered, listHref, naturalDirection, parseListQuery } from './ListQuery';

const SPEC = {
  sorts: ['NAME', 'CREATED_AT', 'UPDATED_AT'],
  defaultSort: 'NAME',
  filters: {
    ownerId: 'id',
    industry: 'text',
    status: { enum: ['NEW', 'CONTACTED', 'QUALIFIED'], multiple: true },
    priority: { enum: ['LOW', 'MEDIUM', 'HIGH'] },
    followUpBefore: 'date',
    overdue: 'bool',
  },
} as const satisfies ListSpec;

const PATH = '/app/1/companies';

describe(parseListQuery, () => {
  it('falls back to the defaults for hand-edited values', () => {
    expect(
      parseListQuery(SPEC, {
        page: '-1',
        size: '1000',
        sort: 'DROP',
        direction: 'up',
        ownerId: 'abc',
        status: 'NOPE',
      }),
    ).toStrictEqual({ page: 0, size: 20, sort: 'NAME', filters: {}, params: {} });
  });

  it('keeps a page size the list offers', () => {
    const query = parseListQuery(SPEC, { size: '50' });

    expect(query.size).toBe(50);
    expect(query.params).toStrictEqual({ size: '50' });
  });

  it('drops a page past the largest offset the backend takes', () => {
    expect(parseListQuery(SPEC, { page: '21474837', size: '100' }).page).toBe(0);
    expect(parseListQuery(SPEC, { page: '21474836', size: '100' }).page).toBe(21_474_836);
  });

  it('drops a page that is not a plain whole number', () => {
    for (const page of ['1.5', '1e3', ' 2', '0x10', '99999999999999999999']) {
      expect(parseListQuery(SPEC, { page }).page).toBe(0);
    }
  });

  it('reads ownerId=unassigned as the unassigned filter', () => {
    const query = parseListQuery(SPEC, { ownerId: 'unassigned' });

    expect(query.unassigned).toBeTruthy();
    expect(query.filters).toStrictEqual({});
    expect(query.params).toStrictEqual({ ownerId: 'unassigned' });
  });

  it('keeps the valid values of a repeatable enum', () => {
    const query = parseListQuery(SPEC, { status: ['NEW', 'BAD'] });

    expect(query.filters).toStrictEqual({ status: ['NEW'] });
    expect(query.params).toStrictEqual({ status: ['NEW'] });
  });

  it('reads ids, text, single enums, real dates and booleans', () => {
    expect(
      parseListQuery(SPEC, {
        ownerId: '42',
        industry: '  Retail ',
        priority: 'HIGH',
        followUpBefore: '2024-02-29',
        overdue: 'false',
      }).filters,
    ).toStrictEqual({
      ownerId: 42,
      industry: 'Retail',
      priority: 'HIGH',
      followUpBefore: '2024-02-29',
      overdue: false,
    });
    expect(
      parseListQuery(SPEC, {
        ownerId: '007',
        industry: '   ',
        priority: 'low',
        followUpBefore: '2026-02-30',
        overdue: 'yes',
      }).filters,
    ).toStrictEqual({});
  });

  it('drops NUL characters from the search and text filters, which the backend refuses', () => {
    expect(parseListQuery(SPEC, { q: 'ac\u0000me', industry: 'Re\u0000tail' })).toMatchObject({
      q: 'acme',
      filters: { industry: 'Retail' },
      params: { q: 'acme', industry: 'Retail' },
    });
    expect(parseListQuery(SPEC, { q: '\u0000', industry: ' \u0000 ' }).params).toStrictEqual({});
  });

  it('reads the search, the archived view, the sort and its direction', () => {
    const query = parseListQuery(SPEC, {
      q: '  acme ',
      archived: 'true',
      sort: 'UPDATED_AT',
      direction: 'ASC',
      page: '2',
    });

    expect(query).toStrictEqual({
      page: 2,
      size: 20,
      sort: 'UPDATED_AT',
      direction: 'ASC',
      q: 'acme',
      archived: true,
      filters: {},
      params: { q: 'acme', archived: 'true', sort: 'UPDATED_AT', direction: 'ASC', page: '2' },
    });
  });
});

describe(naturalDirection, () => {
  it('sorts dates and priorities newest or highest first, names A to Z', () => {
    expect(naturalDirection('UPDATED_AT')).toBe('DESC');
    expect(naturalDirection('PRIORITY')).toBe('DESC');
    expect(naturalDirection('NAME')).toBe('ASC');
    expect(naturalDirection('DUE_AT')).toBe('ASC');
  });
});

describe(listHref, () => {
  const query = parseListQuery(SPEC, { q: 'acme', page: '3', size: '50' });

  it('goes back to the first page when anything but the page changes', () => {
    expect(listHref(PATH, query, { q: 'globex' })).toBe(`${PATH}?q=globex&size=50`);
  });

  it('keeps the other params when the page changes', () => {
    expect(listHref(PATH, query, { page: '4' })).toBe(`${PATH}?q=acme&page=4&size=50`);
  });

  it('removes a param set to nothing, down to the bare path', () => {
    expect(listHref(PATH, query, { q: undefined, size: undefined })).toBe(PATH);
  });

  it('repeats a param with several values', () => {
    expect(listHref(PATH, parseListQuery(SPEC, {}), { status: ['NEW', 'QUALIFIED'] })).toBe(
      `${PATH}?status=NEW&status=QUALIFIED`,
    );
  });
});

describe(isFiltered, () => {
  const filtered = (query: Record<string, string>) => isFiltered(parseListQuery(SPEC, query));

  it('leaves the archive, the sort, the paging and dropped values out', () => {
    expect(filtered({ archived: 'true', sort: 'UPDATED_AT', page: '2', size: '50' })).toBeFalsy();
    expect(filtered({ ownerId: 'abc' })).toBeFalsy();
  });

  it('counts a search, an owner filter or any other filter', () => {
    expect(filtered({ q: 'acme' })).toBeTruthy();
    expect(filtered({ ownerId: 'unassigned' })).toBeTruthy();
    expect(filtered({ overdue: 'false' })).toBeTruthy();
    expect(filtered({ status: 'NEW' })).toBeTruthy();
  });
});
