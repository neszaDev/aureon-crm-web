import { describe, expect, it } from 'vitest';
import { badgeLabel, qrFileName } from './labels';

describe('campus labels', () => {
  describe(badgeLabel, () => {
    it('hides the badge at zero', () => {
      expect(badgeLabel(0)).toBeNull();
    });

    it('shows counts up to 99 and caps larger ones at 99+', () => {
      expect(badgeLabel(7)).toBe('7');
      expect(badgeLabel(99)).toBe('99');
      expect(badgeLabel(100)).toBe('99+');
    });
  });

  describe(qrFileName, () => {
    it('turns the label into a safe file name', () => {
      expect(qrFileName('MFU Campus 2026!')).toBe('qr-code-mfu-campus-2026.png');
    });

    it('falls back to a plain name for an empty label', () => {
      expect(qrFileName('  ')).toBe('qr-code.png');
    });
  });
});
