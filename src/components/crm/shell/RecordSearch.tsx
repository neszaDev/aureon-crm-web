'use client';

import { cn } from 'cn';
import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import type { SearchGroups } from '@/actions/crm/SearchActions';
import { searchAll } from '@/actions/crm/SearchActions';
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

const TYPING_PAUSE_MS = 250;
// The search needs this many characters (the action holds the same rule).
const MIN_LENGTH = 2;
const GROUPS = ['companies', 'contacts', 'leads', 'deals'] as const;

type Status = 'idle' | 'searching' | 'done' | 'failed';

// The platform tells which shortcut to show. On the server (and while hydrating) it is the Ctrl one.
const subscribe = () => () => {
  // Nothing changes while the page lives: nothing to listen to.
};
const isApple = () => /Mac|iPhone|iPad/u.test(navigator.userAgent);

// The K key: its letter, or, on a layout whose keys give other characters (Thai, Cyrillic), the
// key in that place. A Latin letter that is not k is the layout's own (Ctrl+T on Dvorak's K).
const isKKey = (event: KeyboardEvent) =>
  event.key.toLowerCase() === 'k' || (event.code === 'KeyK' && !/^[a-z]$/iu.test(event.key));

/**
 * Finds a company, contact, lead or deal by what you type (at least 2 characters, after a short
 * pause), from any page: a button in the top bar, and ⌘K or Ctrl+K, open a palette of the first 5
 * of each kind. Arrow keys move through the hits and Enter opens the highlighted one. A hit shows
 * while a newer search is on its way, dimmed and out of reach, so Enter never opens a record the
 * text no longer matches. Closed, it gives the focus back to what had it when the shortcut opened it.
 * @param props Component props.
 * @param props.workspaceId The workspace searched.
 * @param props.className Extra classes for the button (its colours on the vermilion bar).
 * @returns The button and its palette.
 */
export const RecordSearch = (props: { workspaceId: number; className?: string }) => {
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
  const apple = useSyncExternalStore(subscribe, isApple, () => false);
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
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          aria-label={t('open')}
          aria-keyshortcuts="Control+K Meta+K"
          // From md the button is a field: translucent on the bar, paper from lg.
          className={cn(
            'size-9',
            props.className,
            'md:w-52 md:justify-start md:bg-black/10 md:px-3 md:hover:bg-black/20 lg:w-64 lg:border-input lg:bg-field lg:font-normal lg:text-muted-foreground lg:shadow-ply lg:hover:border-muted-foreground lg:hover:bg-accent',
          )}
        >
          <SearchIcon />
          <span aria-hidden="true" className="hidden min-w-0 flex-1 truncate text-left md:block">
            {t('open')}
          </span>
          <kbd
            aria-hidden="true"
            className="hidden rounded-sm border border-current/30 px-1.5 font-mono text-xs font-normal md:block"
          >
            {apple ? '⌘K' : 'Ctrl K'}
          </kbd>
        </Button>
      </DialogTrigger>
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
