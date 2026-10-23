import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { Seal } from './Seal';

describe(Seal, () => {
  describe('initials', () => {
    it('takes the first letters of the first two words of the name', async () => {
      const screen = await render(<Seal name="Ada Lovelace" email="ada@x.com" />);

      await expect.element(screen.getByText('AL')).toBeInTheDocument();
    });

    it('takes the first two letters of the email without a name', async () => {
      const screen = await render(<Seal email="riley.rep@x.com" />);

      await expect.element(screen.getByText('RI')).toBeInTheDocument();
    });

    it('takes the first character of each word of a Thai name', async () => {
      const screen = await render(<Seal name="สมชาย ใจดี" email="somchai@x.com" />);

      await expect.element(screen.getByText('สใ')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('is hidden from assistive technology without a title', async () => {
      const screen = await render(<Seal name="Ada Lovelace" email="ada@x.com" />);

      await expect.element(screen.getByText('AL')).toHaveAttribute('aria-hidden', 'true');
    });

    it('is an image labelled with the title when one is given', async () => {
      await render(<Seal name="Ada Lovelace" email="ada@x.com" title="Ada Lovelace" />);

      await expect.element(page.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();
    });
  });
});
