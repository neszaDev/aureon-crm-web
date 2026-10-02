import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastLevel, contrastRatio, INK_RAMP, THEME_COLORS, toRgb } from './palette';

const css = readFileSync(new URL('../../../styles/global.css', import.meta.url), 'utf-8');

describe('palette', () => {
  it('lists every colour with the value global.css gives it', () => {
    for (const swatch of [...THEME_COLORS, ...INK_RAMP]) {
      const declaration = new RegExp(`--${swatch.token}:\\s*(#[0-9a-f]{6});`, 'iu').exec(css);

      expect({ token: swatch.token, hex: declaration?.[1]?.toLowerCase() }).toStrictEqual({
        token: swatch.token,
        hex: swatch.hex,
      });
    }
  });
});

describe(toRgb, () => {
  it('splits a hex colour into channels', () => {
    expect(toRgb('#1f5c45')).toStrictEqual([31, 92, 69]);
  });
});

describe(contrastRatio, () => {
  it('gives 21:1 for black on white, in either order', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21);
  });

  it('gives 1:1 for a colour against itself', () => {
    expect(contrastRatio('#1f5c45', '#1f5c45')).toBeCloseTo(1);
  });

  it('keeps body ink readable on the card face', () => {
    expect(contrastRatio('#1b2b4b', '#f5f8f3')).toBeGreaterThan(7);
  });
});

describe(contrastLevel, () => {
  it('names the WCAG level a ratio reaches', () => {
    expect(contrastLevel(7.2)).toBe('aaa');
    expect(contrastLevel(4.5)).toBe('aa');
    expect(contrastLevel(3.1)).toBe('large');
    expect(contrastLevel(1.4)).toBe('decorative');
  });
});
