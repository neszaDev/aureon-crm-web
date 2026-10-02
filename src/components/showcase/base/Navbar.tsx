'use client';

import { cn } from 'cn';
import { ChevronDownIcon, MenuIcon, SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { signOut } from '@/actions/AuthActions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Link } from '@/libs/I18nNavigation';

export type NavbarTone = 'folder' | 'paper';

const BAR: Record<NavbarTone, string> = {
  folder: 'bg-folder text-folder-ink',
  paper: 'border border-ink-200 bg-ink-100 text-ink-900',
};

const LINK: Record<NavbarTone, string> = {
  folder:
    'text-folder-ink-soft hover:bg-white/10 hover:text-folder-ink focus-visible:ring-folder-ink focus-visible:ring-offset-folder',
  paper: 'text-ink-700 hover:bg-ink-200 hover:text-ink-950',
};

const COLLAPSE = {
  sm: { toggler: 'sm:hidden', panel: 'sm:flex sm:w-auto sm:flex-1 sm:flex-row sm:items-center' },
  md: { toggler: 'md:hidden', panel: 'md:flex md:w-auto md:flex-1 md:flex-row md:items-center' },
} as const;

/**
 * A horizontal app bar: a brand, then its content. With `expand`, the content folds behind a
 * menu button below that breakpoint and sits inline above it.
 * @param props Component props.
 * @param props.tone Folder-green bar or a light bar on card stock.
 * @param props.label Accessible name of the bar.
 * @param props.brand Brand mark and name, on the left.
 * @param props.expand Breakpoint above which the content is always shown.
 * @param props.children Links, menus and forms.
 * @returns The navbar.
 */
export const Navbar = (props: {
  tone: NavbarTone;
  label: string;
  brand?: React.ReactNode;
  expand?: keyof typeof COLLAPSE;
  children?: React.ReactNode;
}) => {
  const t = useTranslations('NavbarsPage');
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const collapse = props.expand ? COLLAPSE[props.expand] : undefined;

  return (
    <nav
      aria-label={props.label}
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md px-3 py-2',
        BAR[props.tone],
      )}
    >
      {collapse && (
        <Button
          variant={props.tone === 'folder' ? 'inverse-ghost' : 'ghost'}
          size="icon-sm"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t('toggle')}
          className={collapse.toggler}
          onClick={() => {
            setOpen(!open);
          }}
        >
          <MenuIcon />
        </Button>
      )}
      {props.brand}
      {props.children && (
        <div
          id={panelId}
          className={cn(
            'w-full flex-col items-start gap-2 pb-1',
            collapse
              ? cn(open ? 'flex' : 'hidden', collapse.panel, 'sm:pb-0 md:pb-0')
              : 'flex flex-1 flex-row flex-wrap items-center pb-0',
          )}
        >
          {props.children}
        </div>
      )}
    </nav>
  );
};

/**
 * The brand of a navbar: a home link with an optional mark.
 * @param props Component props.
 * @param props.href Where the brand leads (no link when omitted).
 * @param props.children Mark and name.
 * @returns The brand.
 */
export const NavbarBrand = (props: { href?: string; children: React.ReactNode }) => {
  const className =
    'inline-flex items-center gap-2 text-lg font-bold tracking-[-0.01em] whitespace-nowrap';
  return props.href ? (
    <Link
      href={props.href}
      className={cn(
        className,
        'rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      {props.children}
    </Link>
  ) : (
    <span className={className}>{props.children}</span>
  );
};

/**
 * A group of navbar items, stacked when folded and in a row when shown inline.
 * @param props Component props.
 * @param props.end Pushes the group to the right of the bar.
 * @param props.children Links and menus.
 * @returns The group.
 */
export const NavbarGroup = (props: { end?: boolean; children: React.ReactNode }) => (
  <div
    className={cn(
      'flex w-full flex-col gap-1 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center',
      props.end && 'sm:ml-auto',
    )}
  >
    {props.children}
  </div>
);

/**
 * A link in a navbar; a disabled one is greyed out and cannot be followed.
 * @param props Component props.
 * @param props.tone Bar tone.
 * @param props.href Destination.
 * @param props.disabled Greys the link out.
 * @param props.children Link text.
 * @returns The link.
 */
export const NavbarLink = (props: {
  tone: NavbarTone;
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  const className =
    'inline-flex h-9 items-center rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring';
  return props.disabled ? (
    <span
      className={cn(
        className,
        'cursor-not-allowed opacity-50',
        props.tone === 'folder' ? 'text-folder-ink-soft' : 'text-ink-600',
      )}
    >
      {props.children}
    </span>
  ) : (
    <Link
      href={props.href}
      className={cn(className, 'transition-colors duration-150', LINK[props.tone])}
    >
      {props.children}
    </Link>
  );
};

/**
 * Plain text in a navbar.
 * @param props Component props.
 * @param props.tone Bar tone.
 * @param props.children The text.
 * @returns The text.
 */
export const NavbarText = (props: { tone: NavbarTone; children: React.ReactNode }) => (
  <span
    className={cn('text-sm', props.tone === 'folder' ? 'text-folder-ink-soft' : 'text-ink-600')}
  >
    {props.children}
  </span>
);

/**
 * A dropdown menu in a navbar. Entries are links, the real sign-out, or (with `choices`) a
 * single choice such as the language.
 * @param props Component props.
 * @param props.tone Bar tone.
 * @param props.label Trigger text.
 * @param props.items Link entries (`href`) or the sign-out entry (`signOut`).
 * @param props.choices Mutually exclusive options; the first starts chosen.
 * @returns The menu.
 */
export const NavbarMenu = (props: {
  tone: NavbarTone;
  label: string;
  items?: { label: string; href?: string; signOut?: boolean }[];
  choices?: string[];
}) => {
  const [choice, setChoice] = useState(props.choices?.[0] ?? '');
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={props.tone === 'folder' ? 'inverse-ghost' : 'ghost'}
          className="justify-start px-3 font-medium"
        >
          {props.label}
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-36">
        {props.choices && (
          <DropdownMenuRadioGroup value={choice} onValueChange={setChoice}>
            {props.choices.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {option}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
        {props.items?.map((item) =>
          item.href ? (
            <DropdownMenuItem key={item.label} asChild>
              <Link href={item.href}>{item.label}</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={item.label}
              onSelect={() => {
                if (item.signOut) {
                  startTransition(async () => {
                    await signOut();
                  });
                }
              }}
            >
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * A search form for a navbar. The demo has nothing to search, so a submitted query is answered
 * with a toast.
 * @param props Component props.
 * @param props.tone Bar tone.
 * @param props.placeholder Input placeholder and accessible name.
 * @param props.button Button text (no button when omitted).
 * @returns The form.
 */
export const NavbarSearch = (props: { tone: NavbarTone; placeholder: string; button?: string }) => {
  const t = useTranslations('NavbarsPage');

  return (
    <search className="w-full sm:w-auto">
      <form
        className="flex w-full items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const query = new FormData(event.currentTarget).get('q');
          const text = typeof query === 'string' ? query.trim() : '';
          toast(text ? t('search_result', { query: text }) : t('search_empty'));
        }}
      >
        <Input
          name="q"
          type="search"
          aria-label={props.placeholder}
          placeholder={props.placeholder}
          className="h-8 min-w-0 flex-1 sm:w-48"
        />
        {props.button && (
          <Button type="submit" size="sm" variant={props.tone === 'folder' ? 'inverse' : 'outline'}>
            <SearchIcon data-icon="inline-start" />
            {props.button}
          </Button>
        )}
      </form>
    </search>
  );
};
