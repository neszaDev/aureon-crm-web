/** A slot of the page list: a page number or a gap for hidden pages. */
export type PageSlot = number | 'gap';

/**
 * The page buttons to show, like CoreUI's pagination: at most `limit` pages around the current
 * one, with a gap at either end when pages are hidden there.
 * @param options Window options.
 * @param options.page Current page, one-based.
 * @param options.pages Number of pages.
 * @param options.limit Most page buttons to show.
 * @returns The page slots in order.
 */
export const pageWindow = (options: { page: number; pages: number; limit?: number }) => {
  const limit = Math.max(options.limit ?? 5, 1);
  const pages = Math.max(options.pages, 0);
  if (pages <= limit) {
    return Array.from({ length: pages }, (_, index): PageSlot => index + 1);
  }

  const start = Math.min(Math.max(options.page - Math.floor(limit / 2), 1), pages - limit + 1);
  const end = start + limit - 1;
  const slots: PageSlot[] = Array.from({ length: limit }, (_, index) => start + index);
  if (start > 1) {
    slots.unshift('gap');
  }
  if (end < pages) {
    slots.push('gap');
  }
  return slots;
};
