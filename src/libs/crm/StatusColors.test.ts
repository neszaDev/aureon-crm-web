import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/components/showcase/theme/palette';
import type { StatusTone } from './StatusColors';
import {
  DUE_BUCKET_TONES,
  LEAD_STATUS_TONES,
  PRIORITY_TONES,
  stageTone,
  TASK_STATUS_TONES,
} from './StatusColors';

const css = readFileSync(new URL('../../styles/global.css', import.meta.url), 'utf-8');

/**
 * The custom properties a block of global.css declares.
 * @param block The block's text.
 * @returns Each property's raw value, by name.
 */
const declarations = (block: string): Record<string, string> =>
  Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*([^;]+);/gu)].map((match) => [
      match[1] ?? '',
      match[2]?.trim() ?? '',
    ]),
  );

const darkStart = css.indexOf('@variant dark {');
const lightTokens = declarations(css.slice(css.indexOf(':root {'), darkStart));
const darkTokens = {
  ...lightTokens,
  ...declarations(css.slice(darkStart, css.indexOf('\n  }\n', darkStart))),
};
const THEMES = { light: lightTokens, dark: darkTokens };

/**
 * A token's colour in a theme, following `var()` references.
 * @param theme The theme's declarations.
 * @param name The token, without `--`.
 * @returns Its `#rrggbb` value, or what it ends on when that isn't one.
 */
const colour = (theme: Record<string, string | undefined>, name: string): string | undefined => {
  const value = theme[name];
  const reference = /^var\(--([\w-]+)\)$/u.exec(value ?? '')?.[1];

  return reference ? colour(theme, reference) : value;
};

/**
 * The contrast between two tokens in a theme.
 * @param theme The theme's declarations.
 * @param first A token.
 * @param second Another token.
 * @returns The WCAG ratio (0 when either isn't a hex colour, which fails every bound).
 */
const contrast = (theme: Record<string, string | undefined>, first: string, second: string) => {
  const [a, b] = [colour(theme, first), colour(theme, second)];
  const hex = /^#[\da-f]{6}$/iu;

  return a && b && hex.test(a) && hex.test(b) ? contrastRatio(a, b) : 0;
};

const TONES: StatusTone[] = ['blue', 'violet', 'amber', 'green', 'red', 'slate'];

describe('status tones', () => {
  it('gives each lead status, task state, due bucket and priority its tone', () => {
    expect(LEAD_STATUS_TONES).toStrictEqual({
      NEW: 'blue',
      CONTACTED: 'violet',
      QUALIFIED: 'amber',
      CONVERTED: 'green',
      UNQUALIFIED: 'slate',
    });
    expect(TASK_STATUS_TONES).toStrictEqual({
      OPEN: 'blue',
      COMPLETED: 'green',
      CANCELLED: 'slate',
    });
    expect(DUE_BUCKET_TONES).toStrictEqual({
      OVERDUE: 'red',
      TODAY: 'amber',
      NEXT_7_DAYS: 'blue',
      LATER: 'violet',
      NO_DATE: 'slate',
    });
    expect(PRIORITY_TONES).toStrictEqual({ HIGH: 'red', MEDIUM: 'amber', LOW: 'slate' });
  });
});

/**
 * A pipeline of open stages (ids 1 to `open`), then won (90) and lost (91).
 * @param open How many open stages.
 * @returns The stages, in order.
 */
const pipeline = (open: number) => [
  ...Array.from({ length: open }, (_, index) => ({ id: index + 1, kind: 'OPEN' as const })),
  { id: 90, kind: 'WON' as const },
  { id: 91, kind: 'LOST' as const },
];

describe(stageTone, () => {
  const tones = (open: number) =>
    pipeline(open).map((stage) => stageTone(pipeline(open), stage.id));

  it('walks the open stages from blue through violet to amber, then won green and lost red', () => {
    expect(tones(3)).toStrictEqual(['blue', 'violet', 'amber', 'green', 'red']);
    expect(tones(5)).toStrictEqual(['blue', 'violet', 'violet', 'amber', 'amber', 'green', 'red']);
  });

  it('starts at blue and ends at amber however few open stages there are', () => {
    expect(tones(1)).toStrictEqual(['blue', 'green', 'red']);
    expect(tones(2)).toStrictEqual(['blue', 'amber', 'green', 'red']);
  });

  it('gives slate to a stage the pipeline does not hold', () => {
    expect(stageTone(pipeline(3), 404)).toBe('slate');
  });
});

describe('colour tokens', () => {
  describe.each(Object.entries(THEMES))('in the %s theme', (themeName, theme) => {
    it.each(TONES)('keeps the %s pill readable: its ink on its tint and on the canvas', (tone) => {
      expect(contrast(theme, `status-${tone}-ink`, `status-${tone}-tint`)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(theme, `status-${tone}-ink`, 'canvas')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme, `status-${tone}-ink`, 'card')).toBeGreaterThanOrEqual(4.5);
    });

    it.each(TONES)('draws the %s hue at 3:1 or more on the canvas', (tone) => {
      // The contract's light amber (#e69a1c, 2.3:1) only ever sits beside its words.
      const floor = themeName === 'light' && tone === 'amber' ? 2.3 : 3;

      expect(contrast(theme, `status-${tone}`, 'canvas')).toBeGreaterThanOrEqual(floor);
    });

    it('keeps text at 4.5:1 on every surface it sits on', () => {
      for (const surface of ['canvas', 'card', 'field', 'sidebar', 'muted', 'violet-tint']) {
        expect({ surface, ink: contrast(theme, 'ink', surface) >= 4.5 }).toStrictEqual({
          surface,
          ink: true,
        });
        expect({ surface, ink2: contrast(theme, 'ink-2', surface) >= 4.5 }).toStrictEqual({
          surface,
          ink2: true,
        });
      }
      expect(contrast(theme, 'violet-ink', 'canvas')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme, 'violet-ink', 'violet-tint')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme, 'danger', 'card')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme, 'on-rail', 'rail')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme, 'on-rail', 'rail-raised')).toBeGreaterThanOrEqual(4.5);
    });

    it('fills primary actions and avatars so white reads at 4.5:1', () => {
      for (const fill of [
        'violet',
        'violet-hover',
        ...Array.from({ length: 8 }, (_, i) => `avatar-${i + 1}`),
      ]) {
        expect({
          fill,
          white: contrastRatio('#ffffff', colour(theme, fill) ?? '#ffffff') >= 4.5,
        }).toStrictEqual({
          fill,
          white: true,
        });
      }
    });

    it('draws control borders and the focus ring at 3:1 on the canvas and panels', () => {
      for (const surface of ['canvas', 'card', 'sidebar']) {
        expect(contrast(theme, 'input', surface)).toBeGreaterThanOrEqual(3);
        expect(contrast(theme, 'ring', surface)).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
