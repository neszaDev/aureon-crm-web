import '@/styles/global.css';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LEAD_STATUS_TONES } from '@/libs/crm/StatusColors';
import messages from '@/locales/en.json';
import { StatusPill } from './StatusPill';

const renderPill = async (pill: React.ReactNode) =>
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      {pill}
    </NextIntlClientProvider>,
  );

describe(StatusPill, () => {
  it('takes the tone of the status it shows', async () => {
    await renderPill(<StatusPill tone={LEAD_STATUS_TONES.QUALIFIED} label="Qualified" />);

    await expect.element(page.getByText('Qualified', { exact: true })).toBeVisible();
    expect(document.querySelector<HTMLElement>('[data-tone]')?.dataset.tone).toBe('amber');
  });

  it("draws its words in the tone's ink on the tone's tint", async () => {
    await renderPill(<StatusPill tone="amber" label="Qualified" />);

    // The tokens reach the pill through `data-tone`: amber ink #956412 on amber tint #fcf2e1.
    const pill = getComputedStyle(document.querySelector('[data-tone]') ?? document.body);
    expect(pill.color).toBe('rgb(149, 100, 18)');
    expect(pill.backgroundColor).toBe('rgb(252, 242, 225)');
  });

  it('reads as one phrase naming what it is the status of', async () => {
    await renderPill(<StatusPill tone="amber" label="Qualified" />);

    const pill = document.querySelector('[data-tone]');

    // The drawn word is hidden from assistive technology, which reads the phrase instead.
    expect(pill?.querySelector('.sr-only')?.textContent).toBe('Status: Qualified');
    await expect
      .element(page.getByText('Qualified', { exact: true }))
      .toHaveAttribute('aria-hidden', 'true');
  });

  it('names a stage as a stage', async () => {
    await renderPill(<StatusPill tone="blue" label="Proposal" field="Stage" />);

    expect(document.querySelector('[data-tone] .sr-only')?.textContent).toBe('Stage: Proposal');
  });

  describe('with a menu', () => {
    it('is the button that opens it, named "Status: Qualified"', async () => {
      const choose = vi.fn<() => void>();
      await renderPill(
        <StatusPill
          tone="amber"
          label="Qualified"
          menu={<DropdownMenuItem onSelect={choose}>Contacted</DropdownMenuItem>}
        />,
      );

      const button = page.getByRole('button', { name: 'Status: Qualified' });
      await expect.element(button).toHaveAttribute('aria-expanded', 'false');
      await button.click();
      await page.getByRole('menuitem', { name: 'Contacted' }).click();

      expect(choose).toHaveBeenCalledOnce();
    });

    it('opens from the keyboard and gives focus back when closed', async () => {
      await renderPill(
        <StatusPill
          tone="amber"
          label="Qualified"
          menu={<DropdownMenuItem>Contacted</DropdownMenuItem>}
        />,
      );

      const button = page.getByRole('button', { name: 'Status: Qualified' });
      await userEvent.keyboard('{Tab}');
      await expect.element(button).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect.element(page.getByRole('menuitem', { name: 'Contacted' })).toHaveFocus();
      await userEvent.keyboard('{Escape}');

      await expect.element(button).toHaveFocus();
    });

    it('spins and stays shut while a change is on its way, keeping the focus', async () => {
      await renderPill(
        <StatusPill
          tone="amber"
          label="Qualified"
          pending
          menu={<DropdownMenuItem>Contacted</DropdownMenuItem>}
        />,
      );

      const button = page.getByRole('button', { name: 'Status: Qualified' });
      await expect.element(button).toHaveAttribute('aria-busy', 'true');
      await expect.element(button).toHaveAttribute('aria-disabled', 'true');
      await userEvent.keyboard('{Tab}');
      await userEvent.keyboard('{Enter}');
      // Forced: an aria-disabled button counts as disabled to the test's clicks.
      await button.click({ force: true });

      await expect.element(button).toHaveFocus();
      await expect.element(button).toHaveAttribute('aria-expanded', 'false');
      await expect.element(page.getByRole('menuitem')).not.toBeInTheDocument();
    });

    it('opens nothing when disabled, and is not busy', async () => {
      await renderPill(
        <StatusPill
          tone="amber"
          label="Qualified"
          disabled
          menu={<DropdownMenuItem>Contacted</DropdownMenuItem>}
        />,
      );

      const button = page.getByRole('button', { name: 'Status: Qualified' });
      await button.click({ force: true });

      await expect.element(button).toHaveAttribute('aria-disabled', 'true');
      await expect.element(button).not.toHaveAttribute('aria-busy');
      await expect.element(page.getByRole('menuitem')).not.toBeInTheDocument();
    });
  });
});
