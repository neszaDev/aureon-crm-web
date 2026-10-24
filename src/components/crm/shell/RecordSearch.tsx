'use client';

import { cn } from 'cn';
import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { SearchGroups } from '@/actions/crm/SearchActions';
import { searchAll } from '@/actions/crm/SearchActions';
import { ShellTip } from '@/components/crm/shell/ShellTip';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useRouter } from '@/libs/I18nNavigation';
import { useIsApple } from '@/utils/Platform';

const TYPING_PAUSE_MS = 250;
// The search needs this many characters (the action holds the same rule).
const MIN_LENGTH = 2;
const GROUPS = ['companies', 'contacts', 'leads', 'deals'] as const;

type Status = 'idle' | 'searching' | 'done' | 'failed';

// The K key: its letter, or, on a layout whose keys give other characters (Thai, Cyrillic), the
// key in that place. A Latin letter that is not k is the layout's own (Ctrl+T on Dvorak's K).
const isKKey = (event: KeyboardEvent) =>
  event.key.toLowerCase() === 'k' || (event.code === 'KeyK' && !/^[a-z]$/iu.test(event.key));

/**
 * Finds a company, contact, lead or deal by what you type (at least 2 characters, after a short
 * pause), from any page: its field in the top bar (from 1024 px), its icon (on the rail, or in the
 * phone's top bar) and ⌘K or Ctrl+K open a palette of the first 5 of each kind. Arrow keys move through the hits and Enter opens the highlighted one. A hit shows
 * while a newer search is on its way, dimmed and out of reach, so Enter never opens a record the
 * text no longer matches. Closed, it gives the focus back to what had it when the shortcut opened it.
 * @param props Component props.
 * @param props.workspaceId The workspace searched.
 * @param props.side Where its icon's tooltip shows: `right` on the rail, `bottom` in the top bar.
 * @param props.field Whether it opens from a button drawn as a search field, "Search ⌘K" (the top
 *   bar's, from 1024 px), rather than an icon.
 * @param props.className Extra classes for the button (its colours on the rail).
 * @returns The button and its palette.
 */
export const RecordSearch = (props: {
  workspaceId: number;
  side: 'right' | 'bottom';
  field?: boolean;
  className?: string;
}) => {
  const t = useTranslations('RecordSearch');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [groups, setGroups] = useState<SearchGroups>();
  const [status, setStatus] = useState<Status>('idle');
  const [highlight, setHighlight] = useState('');
  // The text whose answer may show: an earlier search answering late is dropped.
  const latest = useRef('');
  const timer = useRef(0);
  const shortcut = useIsApple() ? '⌘K' : 'Ctrl K';
  // What had the focus when the shortcut opened the palette, to give it back on closing; none
  // when its button did, which keeps the focus.
  const opener = useRef<HTMLElement | null>(null);
  const openWithShortcut = useEffectEvent(() => {
    if (!open) {
      const active = document.activeElement;
      opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
    }
    setOpen(true);
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && isKKey(event)) {
        event.preventDefault();
        openWithShortcut();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const close = () => {
    window.clearTimeout(timer.current);
    latest.current = '';
    setOpen(false);
    setText('');
    setGroups(undefined);
    setStatus('idle');
    setHighlight('');
  };
  const type = (value: string) => {
    setText(value);
    window.clearTimeout(timer.current);
    const q = value.trim();
    latest.current = q;
    if (q.length < MIN_LENGTH) {
      setGroups(undefined);
      setStatus('idle');
      return;
    }
    setStatus('searching');
    timer.current = window.setTimeout(async () => {
      let found: SearchGroups | undefined;
      try {
        found = await searchAll(props.workspaceId, q);
      } catch {
        found = undefined;
      }
      if (latest.current === q) {
        setGroups(found);
        setHighlight(GROUPS.map((group) => found?.[group][0]?.href).find(Boolean) ?? '');
        setStatus(found ? 'done' : 'failed');
      }
    }, TYPING_PAUSE_MS);
  };

  const count = groups ? GROUPS.reduce((sum, group) => sum + groups[group].length, 0) : 0;
  // The list's status, always read out; shown only while the list has no hits to show.
  let notice = t('hint');
  if (status === 'searching') {
    notice = t('searching');
  } else if (status === 'failed') {
    notice = t('error');
  } else if (status === 'done') {
    notice = count === 0 ? t('empty') : t('count', { count });
  }
  const shown = count === 0 || status === 'failed';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          opener.current = null;
          setOpen(true);
        } else {
          close();
        }
      }}
    >
      {props.field ? (
        <DialogTrigger asChild>
          {/* Named as the icon is; what it shows is "Search" and the shortcut. */}
          <button
            type="button"
            aria-label={t('open')}
            aria-keyshortcuts="Control+K Meta+K"
            className={cn(
              'flex h-8 items-center gap-2 rounded-md border border-rule bg-sidebar px-2.5 text-[0.8125rem] text-ink-2 transition-colors duration-150 outline-none hover:border-input hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              props.className,
            )}
          >
            <SearchIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="flex-1 truncate text-left">{t('field')}</span>
            <kbd
              aria-hidden="true"
              className="rounded-[4px] border border-rule bg-background px-1.5 font-sans text-[0.6875rem] leading-[1.125rem] font-medium"
            >
              {shortcut}
            </kbd>
          </button>
        </DialogTrigger>
      ) : (
        <ShellTip
          side={props.side}
          label={
            <>
              {t('open')}
              <kbd data-slot="kbd" className="font-sans opacity-75">
                {shortcut}
              </kbd>
            </>
          }
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('open')}
              aria-keyshortcuts="Control+K Meta+K"
              className={props.className}
            >
              <SearchIcon />
            </Button>
          </DialogTrigger>
        </ShellTip>
      )}
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          const back = opener.current;
          opener.current = null;
          if (back?.isConnected) {
            event.preventDefault();
            back.focus();
          }
        }}
        className="top-[8dvh] translate-y-0 gap-0 overflow-hidden p-0 sm:top-[14dvh] sm:max-w-lg"
      >
        <DialogTitle className="sr-only">{t('title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('description')}</DialogDescription>
        {/* The server filters; cmdk only moves the highlight. */}
        <Command
          shouldFilter={false}
          loop
          label={t('title')}
          value={highlight}
          onValueChange={setHighlight}
        >
          <CommandInput
            value={text}
            onValueChange={type}
            placeholder={t('placeholder')}
            maxLength={200}
          />
          <CommandList aria-busy={status === 'searching'} className="max-h-[min(24rem,60dvh)]">
            {GROUPS.map((group) =>
              groups?.[group].length ? (
                <CommandGroup key={group} heading={t(`group_${group}`)}>
                  {groups[group].map((hit) => (
                    <CommandItem
                      key={hit.href}
                      value={hit.href}
                      disabled={status === 'searching'}
                      onSelect={() => {
                        router.push(hit.href);
                        close();
                      }}
                    >
                      <span className="min-w-14 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                        {hit.reference}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="break-words">{hit.label}</span>
                        {hit.detail && (
                          <span className="text-xs break-words text-muted-foreground">
                            {hit.detail}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null,
            )}
          </CommandList>
          <output
            className={cn(
              shown ? 'block px-3 py-6 text-center text-sm text-muted-foreground' : 'sr-only',
            )}
          >
            {notice}
          </output>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
