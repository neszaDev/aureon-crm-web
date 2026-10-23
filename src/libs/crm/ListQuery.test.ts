import { describe, expect, it } from 'vitest';
import type { ListSpec } from './ListQuery';
import {
  filterCount,
  isFiltered,
  listHref,
  naturalDirection,
  ownerGroups,
  parseListQuery,
  pastEndHref,
} from './ListQuery';

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
  groups: ['owner'],
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

describe('grouping', () => {
  it('reads a group the list offers and keeps it in the links', () => {
    const query = parseListQuery(SPEC, { group: 'owner', page: '2' });

    expect(query.group).toBe('owner');
    expect(listHref(PATH, query, { sort: 'UPDATED_AT' })).toBe(
      `${PATH}?group=owner&sort=UPDATED_AT`,
    );
  });

  it('drops none, the default, and a group the list does not offer', () => {
    for (const group of ['none', 'status', '']) {
      const query = parseListQuery(SPEC, { group });

      expect(query.group).toBeUndefined();
      expect(query.params).toStrictEqual({});
    }
  });
});

const member = (userId: number, displayName: string) => ({
  userId,
  displayName,
  email: `${displayName.toLowerCase()}@acme.test`,
  role: 'SALES_REP' as const,
  joinedAt: '2026-01-01T00:00:00Z',
});

describe(ownerGroups, () => {
  const members = [member(1, 'Mia'), member(2, 'Owen'), member(3, 'Riley')];

  it('puts the caller first and Unassigned last', () => {
    const query = parseListQuery(SPEC, {
      group: 'owner',
      q: 'acme',
      page: '3',
      sort: 'UPDATED_AT',
    });

    const groups = ownerGroups(query, members, 2);

    expect(groups.map((group) => group.params.ownerId)).toStrictEqual([
      '2',
      '1',
      '3',
      'unassigned',
    ]);
    expect(groups.map((group) => group.member?.displayName)).toStrictEqual([
      'Owen',
      'Mia',
      'Riley',
      undefined,
    ]);
  });

  it('reads each group as the list, narrowed to its owner, from the first of 50 rows', () => {
    const query = parseListQuery(SPEC, {
      group: 'owner',
      q: 'acme',
      page: '3',
      sort: 'UPDATED_AT',
    });

    const reads = ownerGroups(query, members, 2).map((group) => ({
      page: group.query.page,
      size: group.query.size,
      q: group.query.q,
      sort: group.query.sort,
      ownerId: group.query.filters.ownerId,
      unassigned: group.query.unassigned,
    }));

    const read = { page: 0, size: 50, q: 'acme', sort: 'UPDATED_AT' };
    expect(reads).toStrictEqual([
      { ...read, ownerId: 2, unassigned: undefined },
      { ...read, ownerId: 1, unassigned: undefined },
      { ...read, ownerId: 3, unassigned: undefined },
      { ...read, ownerId: undefined, unassigned: true },
    ]);
  });

  it('keeps only the owner the list is filtered by', () => {
    expect(
      ownerGroups(parseListQuery(SPEC, { ownerId: '3' }), members, 2).map(
        (group) => group.params.ownerId,
      ),
    ).toStrictEqual(['3']);
    expect(
      ownerGroups(parseListQuery(SPEC, { ownerId: 'unassigned' }), members, 2).map(
        (group) => group.params.ownerId,
      ),
    ).toStrictEqual(['unassigned']);
    // A member who left: no group holds their records any more.
    expect(ownerGroups(parseListQuery(SPEC, { ownerId: '9' }), members, 2)).toStrictEqual([]);
  });
});

describe(filterCount, () => {
  it('counts the filters, Unassigned too, but not the search or the archive', () => {
    expect(filterCount(parseListQuery(SPEC, { q: 'acme', archived: 'true' }))).toBe(0);
    expect(filterCount(parseListQuery(SPEC, { ownerId: 'unassigned', industry: 'Retail' }))).toBe(
      2,
    );
  });
});

describe(pastEndHref, () => {
  const query = parseListQuery(SPEC, { q: 'acme', page: '5' });

  it('sends a page past the end to the last one', () => {
    expect(pastEndHref(PATH, query, { content: [], totalPages: 3 })).toBe(`${PATH}?q=acme&page=2`);
    expect(pastEndHref(PATH, query, { content: [], totalPages: 1 })).toBe(`${PATH}?q=acme`);
  });

  it('keeps a page with rows, and a list without any', () => {
    expect(pastEndHref(PATH, query, { content: [{}], totalPages: 6 })).toBeUndefined();
    expect(pastEndHref(PATH, query, { content: [], totalPages: 0 })).toBeUndefined();
    expect(pastEndHref(PATH, query)).toBeUndefined();
  });
});
