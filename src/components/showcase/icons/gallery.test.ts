import { describe, expect, it } from 'vitest';
import { readGalleryParams, searchNames, toKebabCase } from './gallery';

describe(toKebabCase, () => {
  it('kebab-cases export names like the Vue galleries', () => {
    expect(toKebabCase('cibFacebook')).toBe('cib-facebook');
    expect(toKebabCase('cib500px5')).toBe('cib-500px-5');
    expect(toKebabCase('cifFr')).toBe('cif-fr');
  });
});

describe(readGalleryParams, () => {
  it('trims the query and reads the page', () => {
    expect(readGalleryParams({ q: ' arrow ', page: '2' })).toStrictEqual({
      query: 'arrow',
      page: 2,
    });
  });

  it('falls back to the first page for missing, negative or junk values', () => {
    expect(readGalleryParams({})).toStrictEqual({ query: '', page: 0 });
    expect(readGalleryParams({ page: '-3' }).page).toBe(0);
    expect(readGalleryParams({ page: 'abc' }).page).toBe(0);
    expect(readGalleryParams({ q: ['first', 'second'] }).query).toBe('first');
  });
});

describe(searchNames, () => {
  const names = ['ArrowRight', 'ArrowLeft', 'Calendar', 'cib-github', 'cib-gitlab'];

  it('matches regardless of case, spaces and dashes', () => {
    expect(searchNames(names, { query: 'arrow right', page: 0, pageSize: 10 }).names).toStrictEqual(
      ['ArrowRight'],
    );
    expect(searchNames(names, { query: 'CIBGIT', page: 0, pageSize: 10 }).total).toBe(2);
  });

  it('returns every name for an empty query', () => {
    expect(searchNames(names, { query: '', page: 0, pageSize: 10 }).total).toBe(names.length);
  });

  it('cuts pages and clamps a page past the end to the last one', () => {
    const result = searchNames(names, { query: '', page: 9, pageSize: 2 });

    expect(result).toStrictEqual({ names: ['cib-gitlab'], page: 2, totalPages: 3, total: 5 });
  });

  it('reports no pages when nothing matches', () => {
    expect(searchNames(names, { query: 'zebra', page: 0, pageSize: 2 })).toStrictEqual({
      names: [],
      page: 0,
      totalPages: 0,
      total: 0,
    });
  });
});
