import { describe, expect, it } from 'vitest';
import { pageWindow } from './pageWindow';

describe(pageWindow, () => {
  describe('Few pages', () => {
    it('lists every page when they fit in the limit', () => {
      expect(pageWindow({ page: 2, pages: 3 })).toStrictEqual([1, 2, 3]);
    });

    it('lists nothing when there are no pages', () => {
      expect(pageWindow({ page: 1, pages: 0 })).toStrictEqual([]);
    });
  });

  describe('Many pages', () => {
    it('centres the window on the current page with gaps on both sides', () => {
      expect(pageWindow({ page: 5, pages: 10 })).toStrictEqual(['gap', 3, 4, 5, 6, 7, 'gap']);
    });

    it('pins the window to the start on the first page', () => {
      expect(pageWindow({ page: 1, pages: 10 })).toStrictEqual([1, 2, 3, 4, 5, 'gap']);
    });

    it('pins the window to the end on the last page', () => {
      expect(pageWindow({ page: 10, pages: 10, limit: 3 })).toStrictEqual(['gap', 8, 9, 10]);
    });
  });
});
