// The name input's line is the styles'.
import '@/styles/global.css';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { Input } from '@/components/ui/input';
import { TITLE_INPUT } from './RecordForm';

// A computed length in pixels, as a number.
const px = (value: string) => Number(value.replace('px', ''));

describe("a record form's name input", () => {
  it('opens its line under Thai, so marks above and below the letters are not clipped', async () => {
    await page.viewport(390, 844);
    await render(
      <div lang="th">
        <Input aria-label="ชื่อ" className={TITLE_INPUT} defaultValue="ผู้ที่ปรึกษาฝ่ายขายฦๅษี" />
      </div>,
    );
    const input = page.getByRole('textbox', { name: 'ชื่อ' }).element();
    const style = getComputedStyle(input);

    // The Thai Breathes Rule: 1.45 or more on a large line, where an input clips what overflows it.
    expect(px(style.lineHeight) / px(style.fontSize)).toBeGreaterThanOrEqual(1.45);
    await page.viewport(414, 896);
  });
});
