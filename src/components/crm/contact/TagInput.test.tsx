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
      {/* Not an <output>: that is a status, as the field's announcements are. */}
      <span data-testid="tags">{tags.join(',')}</span>
    </NextIntlClientProvider>
  );
};

const input = () => page.getByLabelText('Tags');
const value = () => page.getByTestId('tags');
const status = () => page.getByRole('status');
const nineteen = Array.from({ length: 19 }, (_, index) => `tag-${index}`);

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

  it('says what it added and removed, and names its chips', async () => {
    await render(<TagsField />);

    await userEvent.type(input(), 'vip,b2b,');
    await expect.element(status()).toHaveTextContent('b2b added');
    await expect.element(page.getByRole('list', { name: 'Added' })).toBeVisible();

    await page.getByRole('button', { name: 'Remove vip' }).click();
    await expect.element(status()).toHaveTextContent('vip removed');

    await userEvent.click(input());
    await userEvent.keyboard('{Backspace}');
    await expect.element(status()).toHaveTextContent('b2b removed');
  });

  it('adds what was typed when the field loses the focus', async () => {
    await render(<TagsField />);

    await userEvent.type(input(), 'Urgent');
    await userEvent.tab();

    await expect.element(value()).toHaveTextContent(/^urgent$/u);
    await expect.element(input()).toHaveValue('');
  });

  it('drops a pasted overflow past 20 tags and says so, leaving nothing stuck', async () => {
    await render(<TagsField initial={nineteen} />);

    await input().fill('a,b,c');

    await expect.element(value()).toHaveTextContent([...nineteen, 'a'].join(','));
    await expect.element(input()).toHaveValue('');
    await expect
      .element(status())
      .toHaveTextContent('a added. b, c not added: a contact takes at most 20 tags.');
  });

  it('flags a tag longer than 40 characters at once', async () => {
    await render(<TagsField />);

    await userEvent.type(input(), `${'x'.repeat(41)}{Enter}`);

    await expect.element(page.getByText('(too long)')).toBeInTheDocument();
  });
});
