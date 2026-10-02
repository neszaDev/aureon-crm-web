import { describe, expect, it } from 'vitest';
import { buddhistYear, buildOptions, quickRange } from './filters';

describe('campus filters', () => {
  describe(buildOptions, () => {
    const units = [
      {
        _id: 'org-1',
        title: [
          { key: 'en', value: 'Mae Fah Luang University' },
          { key: 'th', value: 'มหาวิทยาลัยแม่ฟ้าหลวง' },
        ],
      },
      { _id: 'org-2', title: [{ key: 'th', value: 'ศูนย์บริการ' }] },
      { _id: 'org-3', title: [{ key: 'th', value: '' }] },
    ];

    it('labels each unit in the current locale', () => {
      expect(buildOptions(units, 'th')[0]).toStrictEqual({
        label: 'มหาวิทยาลัยแม่ฟ้าหลวง',
        value: 'org-1',
      });
    });

    it('falls back to English, then to a dash', () => {
      expect(buildOptions(units, 'fr').map((option) => option.label)).toStrictEqual([
        'Mae Fah Luang University',
        '-',
        '-',
      ]);
    });
  });

  describe(quickRange, () => {
    // Wednesday 2026-09-30.
    const now = new Date(2026, 8, 30, 15, 0);

    it('covers single days for today and yesterday', () => {
      expect(quickRange('today', now)).toStrictEqual({ start: '2026-09-30', end: '2026-09-30' });
      expect(quickRange('yesterday', now)).toStrictEqual({
        start: '2026-09-29',
        end: '2026-09-29',
      });
    });

    it('runs this week from Monday to today and last week from Monday to Sunday', () => {
      expect(quickRange('this_week', now)).toStrictEqual({
        start: '2026-09-28',
        end: '2026-09-30',
      });
      expect(quickRange('last_week', now)).toStrictEqual({
        start: '2026-09-21',
        end: '2026-09-27',
      });
    });

    it('keeps a Sunday inside its own week', () => {
      expect(quickRange('this_week', new Date(2026, 9, 4))).toStrictEqual({
        start: '2026-09-28',
        end: '2026-10-04',
      });
    });
  });

  describe(buddhistYear, () => {
    it('adds 543 to the Gregorian year', () => {
      expect(buddhistYear(new Date(2026, 0, 1))).toBe(2569);
    });
  });
});
