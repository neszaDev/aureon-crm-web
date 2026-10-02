/**
 * Works out which page numbers a pagination bar shows, the way CoreUI's `CPagination` does:
 * at most `limit` slots, with an ellipsis standing in for hidden pages before or after the
 * window around the active page.
 * @param options Pagination state.
 * @param options.activePage The current page (1-based).
 * @param options.pages Total number of pages.
 * @param options.limit Maximum number of slots, ellipses included (default 5).
 * @param options.dots Whether hidden pages are marked with an ellipsis (default true).
 * @returns The page numbers to show and whether an ellipsis goes before or after them.
 */
export const pageItems = (options: {
  activePage: number;
  pages: number;
  limit?: number;
  dots?: boolean;
}) => {
  const limit = options.limit ?? 5;
  const { activePage, pages } = options;
  const showDots = (options.dots ?? true) && limit > 4 && limit < pages;
  const maxPrev = Math.floor((limit - 1) / 2);
  const maxNext = Math.ceil((limit - 1) / 2);
  const beforeDots = showDots && activePage > maxPrev + 1;
  const afterDots = showDots && activePage < pages - maxNext;
  const slots = limit - Number(afterDots) - Number(beforeDots);
  const range = activePage + maxNext;
  const lastItem = range >= pages ? pages : range - Number(afterDots);
  const amount = Math.min(pages, slots);

  const items =
    activePage - maxPrev <= 1
      ? Array.from({ length: amount }, (_, index) => index + 1)
      : Array.from({ length: amount }, (_, index) => lastItem - amount + 1 + index);

  return { items, beforeDots, afterDots };
};
