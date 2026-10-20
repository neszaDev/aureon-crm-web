import { NextIntlClientProvider } from 'next-intl';
import { startTransition, Suspense, use, useState } from 'react';
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

/**
 * Rows read from a promise, as the app router reads a page's payload: a removal is a transition
 * that commits only once its rows arrive, here 400 ms after the action answered.
 * @param props Component props.
 * @param props.rows The rows on their way.
 * @param props.remove Removes a row.
 * @returns The rows.
 */
const SlowRowList = (props: { rows: Promise<string[]>; remove: (row: string) => void }) =>
  use(props.rows).map((row) => (
    <ConfirmAction
      key={row}
      trigger={<button type="button">Delete {row}</button>}
      title={`Delete ${row}?`}
      description="It goes for good."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      fallbackFocus={() => document.querySelector<HTMLElement>('#rows-heading')}
      action={async () => {
        props.remove(row);
        return await Promise.resolve({ ok: true });
      }}
    />
  ));

const LOADED = Promise.resolve(['Demo', 'Proposal']);

const SlowRows = () => {
  const [rows, setRows] = useState(LOADED);

  return (
    <section>
      <h2 id="rows-heading" tabIndex={-1}>
        Stages
      </h2>
      <Suspense>
        <SlowRowList
          rows={rows}
          remove={(row) => {
            const { promise, resolve } = Promise.withResolvers<string[]>();
            setTimeout(() => {
              resolve(['Demo', 'Proposal'].filter((item) => item !== row));
            }, 400);
            startTransition(() => {
              setRows(promise);
            });
          }}
        />
      </Suspense>
    </section>
  );
};

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

  it('moves the focus to the fallback when the row goes only after the action answered', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <SlowRows />
      </NextIntlClientProvider>,
    );

    await page.getByRole('button', { name: 'Delete Demo' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();

    await expect
      .element(page.getByRole('button', { name: 'Delete Demo' }), { timeout: 3000 })
      .not.toBeInTheDocument();
    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
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

  it('shows the failure in the dialog, which stays open, when the request never gets through', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ConfirmAction
          trigger={<button type="button">Delete Demo</button>}
          title="Delete Demo?"
          description="It goes for good."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          action={async () => await Promise.reject(new TypeError('Failed to fetch'))}
        />
      </NextIntlClientProvider>,
    );

    await page.getByRole('button', { name: 'Delete Demo' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent("Couldn't reach the server. Check your connection and try again.");
    await expect.element(page.getByRole('alertdialog')).toBeVisible();
    await expect
      .element(page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }))
      .toBeEnabled();
  });

  it('gives the focus back to the trigger when cancelled', async () => {
    await renderRows();
    const trigger = page.getByRole('button', { name: 'Delete Demo' });

    await trigger.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();

    await expect.element(trigger).toHaveFocus();
  });
});
