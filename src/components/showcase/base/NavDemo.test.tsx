import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { NavDemo } from './NavDemo';

const ITEMS = [
  { id: 'a', label: 'Active' },
  { id: 'b', label: 'Link' },
  { id: 'c', label: 'Disabled', disabled: true },
];

describe(NavDemo, () => {
  it('makes the pressed item current', async () => {
    await render(<NavDemo label="Demo" items={ITEMS} variant="pills" defaultActive="a" />);

    await page.getByRole('button', { name: 'Link' }).click();

    await expect
      .element(page.getByRole('button', { name: 'Link' }))
      .toHaveAttribute('aria-current', 'page');
    await expect
      .element(page.getByRole('button', { name: 'Active' }))
      .not.toHaveAttribute('aria-current');
  });

  it('keeps disabled items out of reach', async () => {
    await render(<NavDemo label="Demo" items={ITEMS} />);

    await expect.element(page.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('marks the dropdown current once one of its entries is chosen', async () => {
    await render(
      <NavDemo
        label="Demo"
        items={ITEMS}
        dropdown={{ label: 'More', groups: [['One'], ['Two']] }}
      />,
    );

    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Two' }).click();

    await expect.element(page.getByRole('button', { name: 'More' })).toHaveClass(/font-semibold/u);
  });
});
