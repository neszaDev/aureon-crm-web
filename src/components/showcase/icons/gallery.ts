/**
 * Kebab-cases an icon export name, as the Vue galleries did (`cibFacebook` → `cib-facebook`).
 * @param name The export name.
 * @returns The kebab-case name.
 */
export const toKebabCase = (name: string) =>
  name.replaceAll(/([a-z])([A-Z0-9])/gu, '$1-$2').toLowerCase();

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? '';

const normalise = (value: string) => value.toLowerCase().replaceAll(/[\s_-]+/gu, '');

/**
 * Reads the gallery's `?q=` and `?page=` search params.
 * @param params The page's search params.
 * @param params.q The search text.
 * @param params.page The zero-based page.
 * @returns The trimmed query and a page number that is never negative.
 */
export const readGalleryParams = (params: { q?: string | string[]; page?: string | string[] }) => ({
  query: first(params.q).trim(),
  page: Math.max(Math.trunc(Number(first(params.page))) || 0, 0),
});

/**
 * Filters names by a search text and cuts out one page of the matches.
 * Matching ignores case, spaces and dashes, so "arrow right", "arrow-right" and "ArrowRight"
 * find the same icons.
 * @param names Every name, in display order.
 * @param options Search and paging.
 * @param options.query The search text.
 * @param options.page Zero-based page; clamped to the last page.
 * @param options.pageSize Names per page.
 * @returns The page of names, the clamped page, the page count and the match count.
 */
export const searchNames = (
  names: readonly string[],
  options: { query: string; page: number; pageSize: number },
) => {
  const needle = normalise(options.query);
  const matches = needle ? names.filter((name) => normalise(name).includes(needle)) : names;
  const totalPages = Math.ceil(matches.length / options.pageSize);
  const page = Math.min(options.page, Math.max(totalPages - 1, 0));

  return {
    names: matches.slice(page * options.pageSize, (page + 1) * options.pageSize),
    page,
    totalPages,
    total: matches.length,
  };
};
