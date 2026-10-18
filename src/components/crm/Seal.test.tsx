import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { initialsOf, Seal } from './Seal';

describe(initialsOf, () => {
  it('skips a Thai legal form before and after the name', () => {
    const plain = initialsOf('ไทยรุ่ง', '');

    expect(plain).toBe('ไ');
    for (const name of [
      'บริษัท ไทยรุ่ง จำกัด',
      'บริษัท ไทยรุ่ง จำกัด (มหาชน)',
      'ห้างหุ้นส่วนจำกัด ไทยรุ่ง',
      'ห้างหุ้นส่วน ไทยรุ่ง',
      'หจก. ไทยรุ่ง',
      'ไทยรุ่ง (มหาชน)',
    ]) {
      expect(initialsOf(name, '')).toBe(plain);
    }
  });

  it('keeps the legal form when the name is nothing else', () => {
    expect(initialsOf('บริษัท', '')).toBe('บ');
  });

  it('leaves Latin names as they are', () => {
    expect(initialsOf('Acme Trading Ltd', '')).toBe('AT');
    expect(initialsOf('Thai Rung Co', '')).toBe('TR');
  });
});

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
