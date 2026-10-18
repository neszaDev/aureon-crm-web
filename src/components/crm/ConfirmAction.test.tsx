import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { ConfirmAction } from './ConfirmAction';

/**
 * A list whose rows delete themselves through a confirmation, like the settings lists.
 * @returns The heading and the rows.
 */
const Rows = () => {
  const [rows, setRows] = useState(['Demo', 'Proposal']);

  return (
    <section>
      <h2 id="rows-heading" tabIndex={-1}>
        Stages
      </h2>
      {rows.map((row) => (
        <ConfirmAction
          key={row}
          trigger={<button type="button">Delete {row}</button>}
          title={`Delete ${row}?`}
          description="It goes for good."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          fallbackFocus={() => document.querySelector<HTMLElement>('#rows-heading')}
          action={async () => {
            setRows((current) => current.filter((item) => item !== row));
            return await Promise.resolve({ ok: true });
          }}
        />
      ))}
    </section>
  );
};

/**
 * A custom trigger that doesn't forward its ref: it passes on only its click.
 * @param props Component props.
 * @param props.onClick Opens the dialog.
 * @param props.children The label.
 * @returns The button.
 */
const NoRefButton = (props: {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}) => (
  <button type="button" onClick={props.onClick}>
    {props.children}
  </button>
);

const renderRows = async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <Rows />
    </NextIntlClientProvider>,
  );
};

describe(ConfirmAction, () => {
  it('moves the focus to the fallback when the deleted row took its trigger along', async () => {
    await renderRows();

    await page.getByRole('button', { name: 'Delete Demo' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();

    await expect.element(page.getByRole('button', { name: 'Delete Demo' })).not.toBeInTheDocument();
    await expect.element(page.getByRole('heading', { name: 'Stages' })).toHaveFocus();
  });

  it("doesn't take the focus to the fallback when a trigger without a ref is cancelled", async () => {
    const fallbackFocus = vi.fn<() => HTMLElement | null>(() =>
      document.querySelector<HTMLElement>('#rows-heading'),
    );
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <h2 id="rows-heading" tabIndex={-1}>
          Stages
        </h2>
        <ConfirmAction
          trigger={<NoRefButton>Delete Demo</NoRefButton>}
          title="Delete Demo?"
          description="It goes for good."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          fallbackFocus={fallbackFocus}
          action={async () => await Promise.resolve({ ok: true })}
        />
      </NextIntlClientProvider>,
    );
    const trigger = page.getByRole('button', { name: 'Delete Demo' });

    await trigger.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
    // Opening it again outlasts the timeout in which the closed dialog hands the focus on.
    await trigger.click();
    await expect.element(page.getByRole('alertdialog')).toBeVisible();

    expect(fallbackFocus).not.toHaveBeenCalled();
  });

  it('gives the focus back to the trigger when cancelled', async () => {
    await renderRows();
    const trigger = page.getByRole('button', { name: 'Delete Demo' });

    await trigger.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();

    await expect.element(trigger).toHaveFocus();
  });
});
