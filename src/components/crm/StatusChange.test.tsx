import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { useKeptFocus } from './StatusChange';

// A record's pill as the lists and the panel draw it: its cell carries `data-pill`.
const Pill = (props: { label: string }) => {
  const [cell] = useKeptFocus('lead-7');

  return (
    <div ref={cell} data-pill="lead-7">
      <button type="button">{props.label}</button>
    </div>
  );
};

// The list behind and the record's panel over it, each with the record's pill; `round` draws
// both anew, as a refresh after a change of status does.
const Page = (props: { round: number }) => (
  <>
    <main id="crm-main">
      <Pill key={`list-${props.round}`} label={`List ${props.round}`} />
    </main>
    {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the record panel's markup (Radix's) */}
    <div role="dialog" aria-label="Lead">
      <Pill key={`panel-${props.round}`} label={`Panel ${props.round}`} />
    </div>
  </>
);

describe(useKeptFocus, () => {
  it('gives the focus back to the pill where it was, the panel’s, not the list’s behind it', async () => {
    const screen = await render(<Page round={1} />);
    page.getByRole('button', { name: 'Panel 1' }).element().focus();

    await screen.rerender(<Page round={2} />);

    await expect.element(page.getByRole('button', { name: 'Panel 2' })).toHaveFocus();
  });

  it('gives it back in the list when the list’s pill had it', async () => {
    const screen = await render(<Page round={1} />);
    page.getByRole('button', { name: 'List 1' }).element().focus();

    await screen.rerender(<Page round={2} />);

    await expect.element(page.getByRole('button', { name: 'List 2' })).toHaveFocus();
  });
});
