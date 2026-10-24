import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { PersonAvatar } from './PersonAvatar';

const avatar = () => document.querySelector<HTMLElement>('[data-slot="person-avatar"]');

describe(PersonAvatar, () => {
  describe('initials', () => {
    it('takes the first letters of the first two words of the name', async () => {
      const screen = await render(
        <PersonAvatar person={{ userId: 1, displayName: 'Ada Lovelace', email: 'ada@x.com' }} />,
      );

      await expect.element(screen.getByText('AL')).toBeInTheDocument();
    });

    it('takes the first two letters of the email without a name', async () => {
      const screen = await render(
        <PersonAvatar person={{ userId: 1, email: 'riley.rep@x.com' }} />,
      );

      await expect.element(screen.getByText('RI')).toBeInTheDocument();
    });

    it('takes the first character of each word of a Thai name', async () => {
      const screen = await render(
        <PersonAvatar person={{ displayName: 'สมชาย ใจดี', email: 'somchai@x.com' }} />,
      );

      await expect.element(screen.getByText('สใ')).toBeInTheDocument();
    });
  });

  describe('colour', () => {
    it('gives a member the same colour wherever they appear, by their id', async () => {
      await render(
        <>
          <PersonAvatar person={{ userId: 9, displayName: 'Ada Lovelace', email: 'ada@x.com' }} />
          <PersonAvatar person={{ userId: 9, displayName: 'Ada L.', email: 'ada@y.com' }} />
          <PersonAvatar person={{ userId: 10, displayName: 'Ada Lovelace', email: 'ada@x.com' }} />
        </>,
      );

      const colours = [
        ...document.querySelectorAll<HTMLElement>('[data-slot="person-avatar"]'),
      ].map((element) => element.style.backgroundColor);

      expect(colours).toStrictEqual(['var(--avatar-2)', 'var(--avatar-2)', 'var(--avatar-3)']);
    });

    it('colours someone who is not a member yet by their email', async () => {
      await render(<PersonAvatar person={{ email: 'new@x.com' }} />);

      expect(avatar()?.style.backgroundColor).toMatch(/^var\(--avatar-[1-8]\)$/u);
    });
  });

  describe('unassigned', () => {
    it('draws a dashed ring with no initials and no colour', async () => {
      await render(<PersonAvatar size="sm" />);

      expect(avatar()?.textContent).toBe('');
      expect(avatar()?.style.backgroundColor).toBe('');
      expect(avatar()?.className).toContain('border-dashed');
    });

    it('is an image named "Unassigned" when given that title', async () => {
      await render(<PersonAvatar title="Unassigned" />);

      await expect.element(page.getByRole('img', { name: 'Unassigned' })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('is hidden from assistive technology without a title', async () => {
      const screen = await render(
        <PersonAvatar person={{ userId: 1, displayName: 'Ada Lovelace', email: 'ada@x.com' }} />,
      );

      await expect.element(screen.getByText('AL')).toHaveAttribute('aria-hidden', 'true');
    });

    it('is an image named by its title, which a tooltip shows on hover', async () => {
      await render(
        <PersonAvatar
          person={{ userId: 1, displayName: 'Ada Lovelace', email: 'ada@x.com' }}
          size="xs"
          title="Ada Lovelace"
        />,
      );

      const image = page.getByRole('img', { name: 'Ada Lovelace' });
      await image.hover();

      await expect.element(page.getByRole('tooltip', { name: 'Ada Lovelace' })).toBeInTheDocument();
    });
  });
});
