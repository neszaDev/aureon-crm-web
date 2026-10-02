import { describe, expect, it } from 'vitest';
import { pageItems } from './pageItems';

describe(pageItems, () => {
  describe('With more pages than slots', () => {
    it('shows the first pages and a trailing ellipsis near the start', () => {
      expect(pageItems({ activePage: 3, pages: 10 })).toStrictEqual({
        items: [1, 2, 3, 4],
        beforeDots: false,
        afterDots: true,
      });
    });

    it('centres the active page between two ellipses in the middle', () => {
      expect(pageItems({ activePage: 6, pages: 10 })).toStrictEqual({
        items: [5, 6, 7],
        beforeDots: true,
        afterDots: true,
      });
    });

    it('shows the last pages and a leading ellipsis near the end', () => {
      expect(pageItems({ activePage: 10, pages: 10 })).toStrictEqual({
        items: [7, 8, 9, 10],
        beforeDots: true,
        afterDots: false,
      });
    });

    it('uses every slot for pages when dots are off', () => {
      expect(pageItems({ activePage: 6, pages: 10, dots: false }).items).toStrictEqual([
        4, 5, 6, 7, 8,
      ]);
    });
  });

  describe('With fewer pages than slots', () => {
    it('lists every page without ellipses', () => {
      expect(pageItems({ activePage: 2, pages: 3 })).toStrictEqual({
        items: [1, 2, 3],
        beforeDots: false,
        afterDots: false,
      });
    });
  });
});
