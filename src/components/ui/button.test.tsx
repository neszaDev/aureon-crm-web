import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { Button } from './button';

const SIZES = ['default', 'xs', 'sm', 'lg'] as const;

describe(Button, () => {
  // `cn` reads an unknown `text-*` class as a colour: a named font size on a size would drop the
  // variant's text colour (dark text on violet).
  it.each(SIZES)('keeps the filled variants’ white text at the %s size', async (size) => {
    await render(
      <>
        <Button size={size}>Save</Button>
        <Button size={size} variant="destructive">
          Delete
        </Button>
      </>,
    );

    await expect
      .element(page.getByRole('button', { name: 'Save' }))
      .toHaveClass('text-primary-foreground');
    await expect.element(page.getByRole('button', { name: 'Delete' })).toHaveClass('text-white');
  });
});
