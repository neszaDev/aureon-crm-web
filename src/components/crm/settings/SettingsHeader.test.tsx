import { DownloadIcon, PlusIcon, UserPlusIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { Button } from '@/components/ui/button';
// The header's layout is what is tested: the real styles are needed.
import '@/styles/global.css';
import { SettingsHeader } from './SettingsHeader';

/**
 * Renders a page header in a content column of the given width, from 640 px up.
 * @param width The content column's width.
 * @param header The header's title, description and actions.
 */
const renderHeader = async (width: number, header: Parameters<typeof SettingsHeader>[0]) => {
  await page.viewport(1280, 800);
  await render(
    <div style={{ width }}>
      <SettingsHeader {...header} />
    </div>,
  );
};

const box = (name: string) => page.getByRole('button', { name }).element().getBoundingClientRect();

describe(SettingsHeader, () => {
  it("keeps a list's two actions side by side beside its title (the deals at 1024 px)", async () => {
    await renderHeader(736, {
      title: 'Deals',
      description:
        'Every deal in your pipeline, by stage. Drag a card to move it, or open the list to filter and sort.',
      action: (
        <>
          <Button variant="outline">
            <DownloadIcon data-icon="inline-start" />
            Export CSV
          </Button>
          <Button>
            <PlusIcon data-icon="inline-start" />
            New deal
          </Button>
        </>
      ),
    });

    expect(box('Export CSV').top).toBe(box('New deal').top);
  });

  it('never lets its one action squeeze onto the description (the members at 640 px)', async () => {
    await renderHeader(584, {
      title: 'Members',
      description:
        'Who works in this workspace and what their role lets them do. Invitation links work once, for 7 days.',
      action: (
        <Button>
          <UserPlusIcon data-icon="inline-start" />
          Invite member
        </Button>
      ),
    });

    const button = page.getByRole('button', { name: 'Invite member' }).element();
    const description = page.getByText('Who works in this workspace', { exact: false }).element();

    expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
    expect(button.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      description.getBoundingClientRect().right,
    );
  });

  it('wraps an action group wider than half the header, so the title keeps its line', async () => {
    await renderHeader(736, {
      title: 'Dashboard',
      description: 'Acme Trading',
      action: ['New company', 'New contact', 'New lead', 'New deal', 'New task'].map((name) => (
        <Button key={name} variant="outline">
          <PlusIcon data-icon="inline-start" />
          {name}
        </Button>
      )),
    });

    const title = page.getByRole('heading', { name: 'Dashboard' }).element();

    expect(title.getBoundingClientRect().height).toBeLessThanOrEqual(
      Number(getComputedStyle(title).lineHeight.replace(/px$/u, '')) + 1,
    );
    expect(box('New task').top).toBeGreaterThan(box('New company').top);
  });
});
