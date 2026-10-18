import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import messages from '@/locales/en.json';
import { TagInput } from './TagInput';

const TagsField = (props: { initial?: string[] }) => {
  const [tags, setTags] = useState(props.initial ?? []);

  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <label htmlFor="tags">Tags</label>
      <TagInput id="tags" value={tags} onChange={setTags} suggestions={['b2b', 'partner', 'vip']} />
      <output data-testid="tags">{tags.join(',')}</output>
    </NextIntlClientProvider>
  );
};

const input = () => page.getByLabelText('Tags');
const value = () => page.getByTestId('tags');

describe(TagInput, () => {
  it('adds the typed tag on a comma, and on Enter, trimmed and in lower case', async () => {
    await render(<TagsField />);

    await userEvent.type(input(), 'vip,');
    await userEvent.type(input(), ' Key Account {Enter}');

    await expect.element(value()).toHaveTextContent('vip,key account');
    await expect.element(input()).toHaveValue('');
    await expect.element(page.getByRole('button', { name: 'Remove vip' })).toBeVisible();
  });

  it('ignores a tag it already has, in any case', async () => {
    await render(<TagsField initial={['vip']} />);

    await userEvent.type(input(), 'VIP{Enter}');

    await expect.element(value()).toHaveTextContent(/^vip$/u);
    await expect.element(input()).toHaveValue('');
  });

  it('removes the last tag on Backspace in the empty input', async () => {
    await render(<TagsField initial={['b2b', 'vip']} />);

    await userEvent.click(input());
    await userEvent.keyboard('{Backspace}');

    await expect.element(value()).toHaveTextContent(/^b2b$/u);
  });

  it('suggests the workspace tags that hold the typed text, not those it has', async () => {
    await render(<TagsField initial={['b2b']} />);

    await userEvent.type(input(), 'P');

    await expect.element(page.getByRole('button', { name: 'Add partner' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Add vip' })).toBeVisible();
    expect(page.getByRole('button', { name: 'Add b2b' }).elements()).toHaveLength(0);

    await page.getByRole('button', { name: 'Add vip' }).click();

    await expect.element(value()).toHaveTextContent('b2b,vip');
    await expect.element(input()).toHaveValue('');
    await expect.element(input()).toHaveFocus();
  });

  it('takes no more than 20 tags, and says so', async () => {
    const twenty = Array.from({ length: 20 }, (_, index) => `tag-${index}`);
    await render(<TagsField initial={twenty} />);

    await expect.element(input()).toHaveAttribute('aria-disabled', 'true');
    await expect.element(input()).toHaveAccessibleDescription(/at most 20 tags/u);

    // Still focusable (Backspace removes a tag), but typing adds nothing. Playwright holds back
    // from an aria-disabled element; a browser click focuses it.
    await userEvent.click(input(), { force: true });
    await userEvent.keyboard('one more{Enter}');

    await expect.element(input()).toHaveValue('');
    await expect.element(value()).toHaveTextContent(twenty.join(','));
  });
});
