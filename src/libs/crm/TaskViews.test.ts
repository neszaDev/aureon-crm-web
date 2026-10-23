import { describe, expect, it } from 'vitest';
import { dueBounds, sectionOf, sectionsOf, viewQuery } from './TaskViews';

// Sunday 18 October 2026, 20:00 UTC: Monday 19 October, 03:00 in Bangkok (UTC+7).
const NOW = Date.UTC(2026, 9, 18, 20);
const BOUNDS = dueBounds('Asia/Bangkok', NOW);

describe(dueBounds, () => {
  it('parts today from tomorrow at midnight in the workspace, and the week a week from now', () => {
    expect(BOUNDS).toStrictEqual({
      now: '2026-10-18T20:00:00.000Z',
      tomorrow: '2026-10-19T17:00:00.000Z',
      week: '2026-10-25T20:00:00.000Z',
    });
  });
});

describe(viewQuery, () => {
  it('asks for the open tasks of each due section, from inclusive and to exclusive', () => {
    const open = ['OPEN'];

    expect(viewQuery('overdue', BOUNDS, false)).toStrictEqual({ status: open, dueTo: BOUNDS.now });
    expect(viewQuery('later', BOUNDS, false)).toStrictEqual({ status: open, dueFrom: BOUNDS.week });
    expect(viewQuery('undated', BOUNDS, false)).toStrictEqual({ status: open });
  });

  it('parts today from the week at the start of tomorrow', () => {
    const open = ['OPEN'];

    expect(viewQuery('today', BOUNDS, false)).toStrictEqual({
      status: open,
      dueFrom: BOUNDS.now,
      dueTo: BOUNDS.tomorrow,
    });
    expect(viewQuery('week', BOUNDS, false)).toStrictEqual({
      status: open,
      dueFrom: BOUNDS.tomorrow,
      dueTo: BOUNDS.week,
    });
  });

  it('keeps "upcoming" as the report counts it: from now to a week on', () => {
    expect(viewQuery('upcoming', BOUNDS, false)).toStrictEqual({
      status: ['OPEN'],
      dueFrom: BOUNDS.now,
      dueTo: BOUNDS.week,
    });
  });

  it('lists closed tasks latest changed first, unless the list has a sort', () => {
    expect(viewQuery('completed', BOUNDS, false)).toStrictEqual({
      status: ['COMPLETED'],
      sort: 'UPDATED_AT',
      direction: 'DESC',
    });
    expect(viewQuery('cancelled', BOUNDS, true)).toStrictEqual({ status: ['CANCELLED'] });
  });

  it('adds nothing without a view', () => {
    expect(viewQuery(undefined, BOUNDS, false)).toStrictEqual({});
  });
});

describe(sectionsOf, () => {
  it('shows every section, upcoming as today and the week, or the one named', () => {
    expect(sectionsOf()).toHaveLength(7);
    expect(sectionsOf('upcoming')).toStrictEqual(['today', 'week']);
    expect(sectionsOf('completed')).toStrictEqual(['completed']);
  });
});

describe(sectionOf, () => {
  it('puts an open task in the section its due time falls in', () => {
    const at = (offset: number) => new Date(NOW + offset * 60 * 60 * 1000).toISOString();

    expect(
      [-1, 0, 21, 7 * 24].map((hours) => sectionOf({ status: 'OPEN', dueAt: at(hours) }, BOUNDS)),
    ).toStrictEqual(['overdue', 'today', 'week', 'later']);
    expect(sectionOf({ status: 'OPEN' }, BOUNDS)).toBe('undated');
  });

  it('puts a closed task in its status, whenever it was due', () => {
    expect(sectionOf({ status: 'COMPLETED', dueAt: BOUNDS.now }, BOUNDS)).toBe('completed');
    expect(sectionOf({ status: 'CANCELLED' }, BOUNDS)).toBe('cancelled');
  });
});
