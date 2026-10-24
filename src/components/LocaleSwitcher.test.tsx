import '@/styles/global.css';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { contrastRatio } from '@/components/showcase/theme/palette';
import type * as Navigation from '@/libs/I18nNavigation';
import messages from '@/locales/en.json';
import { LocaleSwitcher } from './LocaleSwitcher';

vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn<typeof Navigation.usePathname>(() => '/'),
  // @ts-expect-error -- the picker only pushes the new locale with it
  useRouter: vi.fn<typeof Navigation.useRouter>(() => ({ push: vi.fn<() => void>() })),
}));

// A computed `rgb(r, g, b)` as `#rrggbb`.
const hex = (rgb: string) =>
  `#${(rgb.match(/\d+/gu) ?? [])
    .slice(0, 3)
    .map((part) => Number(part).toString(16).padStart(2, '0'))
    .join('')}`;

describe(LocaleSwitcher, () => {
  // The marketing header is the violet brand field; the boilerplate demos' rail is the folder green.
  it.each([
    ['brand', 'bg-violet'],
    ['folder', 'bg-folder'],
  ] as const)('draws its focus outline at 3:1 or more on the %s field', async (tone, field) => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <div data-testid="field" className={`${field} p-4`}>
          <LocaleSwitcher tone={tone} />
        </div>
      </NextIntlClientProvider>,
    );

    await userEvent.keyboard('{Tab}');
    const select = page.getByRole('combobox');
    await expect.element(select).toHaveFocus();
    const outline = getComputedStyle(select.element());
    const fieldColour = getComputedStyle(page.getByTestId('field').element()).backgroundColor;

    expect(outline.outlineStyle).toBe('solid');
    expect(outline.outlineWidth).toBe('2px');
    expect(contrastRatio(hex(outline.outlineColor), hex(fieldColour))).toBeGreaterThanOrEqual(3);
  });
});
