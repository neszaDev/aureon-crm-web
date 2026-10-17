import { describe, expect, it } from 'vitest';
import { parseTheme } from './Theme';

describe(parseTheme, () => {
  it('keeps the light and dark themes', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
  });

  it('falls back to the system theme for anything else', () => {
    expect(parseTheme('x')).toBe('system');
    expect(parseTheme()).toBe('system');
    expect(parseTheme('system')).toBe('system');
  });
});
