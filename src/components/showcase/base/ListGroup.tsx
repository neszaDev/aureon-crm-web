import { cn } from 'cn';
import { Link } from '@/libs/I18nNavigation';
import type { Tone } from './tones';
import { toneSoft, toneSoftHover } from './tones';

/**
 * A ruled list of items on a white sheet; `flush` drops the outer frame so it sits edge to edge
 * inside a card.
 * @param props Component props.
 * @param props.id Element id (a target for hash links).
 * @param props.flush Removes the outer border and corners.
 * @param props.label Accessible name of the list.
 * @param props.className Extra classes.
 * @param props.children `ListGroupItem`s.
 * @returns The list.
 */
export const ListGroup = (props: {
  id?: string;
  flush?: boolean;
  label?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <ul
    id={props.id}
    aria-label={props.label}
    className={cn(
      'flex flex-col bg-ply',
      props.flush
        ? 'border-y border-ink-200'
        : 'overflow-hidden rounded-sm border border-ink-200 shadow-ply',
      props.className,
    )}
  >
    {props.children}
  </ul>
);

/**
 * The shared look of a list row, by state.
 * @param state Row state.
 * @param state.active The current row, filled with folder green.
 * @param state.disabled A row that cannot be used.
 * @param state.interactive A link or button row, with hover and focus styles.
 * @param state.tone Contextual wash.
 * @returns The row classes.
 */
export const listItemClass = (state: {
  active?: boolean;
  disabled?: boolean;
  interactive?: boolean;
  tone?: Tone;
}) =>
  cn(
    'flex w-full px-4 py-3 text-left text-[0.9375rem] text-ink-900 transition-colors duration-150',
    state.tone && toneSoft[state.tone],
    state.interactive &&
      !state.disabled &&
      !state.active &&
      (state.tone
        ? toneSoftHover[state.tone]
        : 'hover:bg-paper-card hover:text-ink-950 focus-visible:bg-paper-card'),
    state.interactive &&
      'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
    state.active && 'bg-folder text-folder-ink',
    state.disabled && 'cursor-not-allowed text-ink-400',
  );

/**
 * One row of a `ListGroup`: plain text, or a link when `href` is set. Hash links stay plain
 * anchors; app paths go through the locale-aware `Link`. A disabled link is announced as such
 * and cannot be followed.
 * @param props Component props.
 * @param props.href Turns the row into a link.
 * @param props.active Marks the current row (and the current page for a link).
 * @param props.disabled Greys the row out.
 * @param props.tone Contextual wash.
 * @param props.className Extra classes for the row content.
 * @param props.children Row content.
 * @returns The list item.
 */
export const ListGroupItem = (props: {
  href?: string;
  active?: boolean;
  disabled?: boolean;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) => {
  const className = cn(
    listItemClass({
      active: props.active,
      disabled: props.disabled,
      interactive: props.href !== undefined,
      tone: props.tone,
    }),
    props.className,
  );

  let content: React.ReactNode;
  if (props.href === undefined) {
    content = (
      <div className={className} aria-disabled={props.disabled ?? undefined}>
        {props.children}
      </div>
    );
  } else if (props.disabled) {
    content = <span className={className}>{props.children}</span>;
  } else if (props.href.startsWith('#')) {
    content = (
      <a href={props.href} aria-current={props.active ? 'true' : undefined} className={className}>
        {props.children}
      </a>
    );
  } else {
    content = (
      <Link
        href={props.href}
        aria-current={props.active ? 'page' : undefined}
        className={className}
      >
        {props.children}
      </Link>
    );
  }

  return <li className="border-b border-ink-200 last:border-b-0">{content}</li>;
};
