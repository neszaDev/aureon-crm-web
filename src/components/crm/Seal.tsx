import { cn } from 'cn';

const SIZES = {
  sm: 'size-6 border-[1.5px] text-[0.6875rem]',
  md: 'size-8 border-2 text-xs',
  lg: 'size-10 border-2 text-sm',
};

/**
 * The seal's initials: the first character of the first two words of the name, else the first
 * two characters of the email's local part. A character is a code point (`/./u`), so a Thai
 * name gives its first consonant or leading vowel, without the marks stacked on it.
 * @param name Display name, if any.
 * @param email Email address.
 * @returns The initials, upper-cased.
 */
const initialsOf = (name: string | undefined, email: string) => {
  const words = name?.trim().split(/\s+/u).filter(Boolean) ?? [];
  const initials =
    words.length > 0
      ? words
          .slice(0, 2)
          .map((word) => /./u.exec(word)?.[0])
          .join('')
      : /^.{0,2}/u.exec(email.split('@')[0] ?? '')?.[0];

  return (initials ?? '').toLocaleUpperCase();
};

/**
 * A person as a round vermilion ink seal with their initials.
 * @param props Component props.
 * @param props.name Display name; the initials come from it when set.
 * @param props.email Email address; the initials come from it without a name.
 * @param props.size `sm` (24 px), `md` (32 px, default) or `lg` (40 px).
 * @param props.title Accessible name; without it the seal is decorative and hidden.
 * @returns The seal.
 */
export const Seal = (props: {
  name?: string;
  email: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}) => (
  <span
    role={props.title ? 'img' : undefined}
    aria-label={props.title}
    aria-hidden={props.title ? undefined : true}
    title={props.title}
    className={cn(
      'inline-grid shrink-0 place-items-center rounded-full border-seal-ink bg-field leading-none font-bold text-seal-ink select-none',
      SIZES[props.size ?? 'md'],
    )}
  >
    {initialsOf(props.name, props.email)}
  </span>
);
