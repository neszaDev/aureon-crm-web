'use client';

import { Maximize2Icon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, use, useEffect, useRef, useState } from 'react';
import { ShellTip } from '@/components/crm/shell/ShellTip';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { leaveEscapeToForm } from '@/utils/Focus';

// A record's URL, or a new record's form (any locale prefix): its list, and the kind of record,
// which names its heading.
const RECORD_PATH = /^(.*\/(companies|contacts|leads|deals|tasks))\/(?:\d+|new)$/u;
const KINDS = {
  companies: 'company',
  contacts: 'contact',
  leads: 'lead',
  deals: 'deal',
  tasks: 'task',
} as const;

// What the ids of a record's page start with in a record panel.
const PANEL_ID = 'panel-';

/**
 * What takes the focus in a record panel: a new record's first field, else the record's name.
 * @param node The panel.
 * @param kind The kind of record, which names its heading.
 * @returns The element, once drawn.
 */
const focusTarget = (node: Element, kind: string) =>
  node.querySelector<HTMLElement>('[data-autofocus]') ??
  node.querySelector<HTMLElement>(`#${PANEL_ID}${kind}-heading`);

/**
 * Whether the component is in a record panel: a form there (a new record's) cancels by closing it
 * (`SheetClose`, as its × does) rather than leave for another page.
 */
export const InRecordPanel = createContext(false);

/**
 * `usePanelId` for a component with many ids, a record form's fields: a new record's form in a
 * panel over the full edit page of a record of its kind has the same ones, and a label, a
 * field's `aria-describedby` or its error would find the page's.
 * @returns What makes an id the panel's own, as `usePanelId` does.
 */
export const usePanelIds = () => {
  const inPanel = use(InRecordPanel);

  return (id: string) => (inPanel && !id.startsWith(PANEL_ID) ? `${PANEL_ID}${id}` : id);
};

/**
 * An id on a record's page (its heading, a section's), made the panel's own in a record panel:
 * the full page of a record of the same kind behind it has the same ones, and a name or label
 * pointing at an id would find that page's first. Applying it twice changes nothing.
 * @param id The page's id, such as `company-heading`.
 * @returns The id to use here.
 */
export const usePanelId = (id: string) => usePanelIds()(id);

/**
 * A record opened from inside the app, in a wide panel over the page it was opened from (an
 * intercepted route: a full load of its URL renders its full page instead). It is named by the
 * record's heading and its kind. ×, Escape (unless a form in it takes the key) and a click on the
 * backdrop close it: back to the page behind, whose link to the record takes the focus again (found anew
 * when a refresh redrew it; the page itself without one, after a search); with nothing to go
 * back to, to the record's list. Its other link opens the full page. A write in it refreshes the
 * page behind too (the action's refresh renders both). A new record's form opens in it the same
 * way (`(.)<kind>/new`), its first field focused, and once saved it shows the new record.
 * @param props Component props.
 * @param props.children The record's page.
 * @returns The panel.
 */
export const RecordPanel = (props: { children: React.ReactNode }) => {
  const t = useTranslations('RecordPanel');
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  // What had the focus as it opened: the row's link, or the search that opened it.
  const opener = useRef<Element>(null);
  const [closing, setClosing] = useState(false);
  const [shown, setShown] = useState(pathname);
  // Opened from its own edit page (its Cancel, the location's link), or as the record just created
  // by its form loaded as a full page (that kind's new form): that page would stay behind the
  // panel. The address bar still names the page behind while the panel first renders.
  const [fromForm, setFromForm] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.location.pathname === `${pathname}/edit` ||
        window.location.pathname === pathname.replace(/\d+$/u, 'new')),
  );
  // Another record opened from this one is open again, even after a close that went back to it.
  if (pathname !== shown && RECORD_PATH.test(pathname)) {
    setShown(pathname);
    setClosing(false);
    setFromForm(false);
  }
  const [, list = '/app', section = ''] = RECORD_PATH.exec(shown) ?? [];
  const kind = Object.entries(KINDS).find(([key]) => key === section)?.[1] ?? 'company';
  const creating = shown.endsWith('/new');
  // That record loads as the full page it is, which only a full load gives (a soft navigation to
  // it is intercepted again).
  useEffect(() => {
    if (fromForm) {
      window.location.replace(window.location.href);
    }
  }, [fromForm]);
  // The panel's node, once its portal has drawn it.
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  // A record's name takes the focus once it is drawn whenever the focus was lost meanwhile: the
  // link to another record goes with the record it was on, and a record still loading leaves the
  // focus on the panel itself. Until the viewer does something in the panel.
  useEffect(() => {
    const take = () => {
      const lost = document.activeElement === document.body || document.activeElement === node;
      if (node && lost) {
        focusTarget(node, kind)?.focus();
      }
    };
    const observer = new MutationObserver(take);
    const stop = () => {
      observer.disconnect();
    };
    if (node) {
      observer.observe(node, { childList: true, subtree: true });
      node.addEventListener('pointerdown', stop, { once: true });
      node.addEventListener('keydown', stop, { once: true });
      take();
    }

    return () => {
      stop();
      node?.removeEventListener('pointerdown', stop);
      node?.removeEventListener('keydown', stop);
    };
  }, [node, shown, kind]);

  // A new record's form typed into: only × and its Cancel close the panel, so nothing typed is lost.
  const keepsForm = () => creating && node?.querySelector('form[data-dirty]') !== null;

  const close = () => {
    if (closing) {
      return;
    }
    setClosing(true);
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(list);
    }
  };

  if (fromForm) {
    return null;
  }

  return (
    <Sheet
      open={!closing}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <SheetContent
        ref={setNode}
        side="right"
        showCloseButton={false}
        closeLabel={t('close')}
        // Its record's name, then what kind of record it is (alone when there is no record); a new
        // record's form by its title ("New deal").
        aria-labelledby={
          creating ? `${PANEL_ID}${kind}-heading` : `${PANEL_ID}${kind}-heading record-panel-kind`
        }
        aria-describedby={undefined}
        // The record's name, or a new record's first field, takes the focus (the panel itself while
        // it loads): a first button would open its tooltip.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          opener.current = document.activeElement;
          const target = event.currentTarget;
          if (target instanceof HTMLElement) {
            (focusTarget(target, kind) ?? target).focus();
          }
        }}
        // What takes Escape itself (`onEscape`: the activity composer closes on it) has it first;
        // in any other form it closes the panel, unless it is a new record's form typed into.
        onEscapeKeyDown={(event) => {
          if (event.target instanceof Element && event.target.closest('[data-escape]')) {
            leaveEscapeToForm(event);
          } else if (keepsForm()) {
            event.preventDefault();
          }
        }}
        // A toast is no click outside; nor is any click while a new record's form is typed into.
        onPointerDownOutside={(event) => {
          if (
            keepsForm() ||
            (event.target instanceof Element && event.target.closest('[data-sonner-toaster]'))
          ) {
            event.preventDefault();
          }
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          // The link that opened it, or its row's link drawn anew; else the page itself.
          const row =
            opener.current instanceof HTMLElement &&
            opener.current.isConnected &&
            opener.current.closest('#crm-main')
              ? opener.current
              : document.querySelector<HTMLElement>(`#crm-main a[href="${shown}"]`);
          (row ?? document.querySelector<HTMLElement>('#crm-main'))?.focus({ preventScroll: true });
        }}
        className="gap-0 bg-background p-0 outline-none data-[side=right]:w-[min(920px,92vw)] data-[side=right]:sm:max-w-none"
      >
        <div className="flex h-12 shrink-0 items-center gap-1 border-b border-rule pr-2 pl-5">
          <SheetTitle className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-muted-foreground">
            <span id="record-panel-kind">{t(`kind_${kind}`)}</span>
          </SheetTitle>
          <ShellTip label={t('full_page')} side="bottom">
            <Button asChild variant="ghost" size="icon-sm">
              {/* A full load: a soft one would open this panel again. */}
              <a href={search ? `${shown}?${search}` : shown} aria-label={t('full_page')}>
                <Maximize2Icon />
              </a>
            </Button>
          </ShellTip>
          <ShellTip label={t('close_hint')} side="bottom">
            <Button variant="ghost" size="icon-sm" aria-label={t('close')} onClick={close}>
              <XIcon />
            </Button>
          </ShellTip>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-12 sm:px-7">
          <InRecordPanel value>{props.children}</InRecordPanel>
        </div>
      </SheetContent>
    </Sheet>
  );
};
