'use client';

import { Maximize2Icon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ShellTip } from '@/components/crm/shell/ShellTip';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { leaveEscapeToForm } from '@/utils/Focus';

// A record's URL (any locale prefix): its list, and the kind of record, which names its heading.
const RECORD_PATH = /^(.*\/(companies|contacts|leads|deals|tasks))\/\d+$/u;
// A new record's form, which the panel's routes take for a record (`(.)deals/[id]` with `new`).
const NEW_FORM = /\/(?:companies|contacts|leads|deals|tasks)\/new$/u;
const KINDS = {
  companies: 'company',
  contacts: 'contact',
  leads: 'lead',
  deals: 'deal',
  tasks: 'task',
} as const;

/**
 * A record opened from inside the app, in a wide panel over the page it was opened from (an
 * intercepted route: a full load of its URL renders its full page instead). It is named by the
 * record's heading and its kind. ×, Escape (unless a form in it takes the key) and a click on the
 * backdrop close it: back to the page behind, whose link to the record takes the focus again (found anew
 * when a refresh redrew it; the page itself without one, after a search); with nothing to go
 * back to, to the record's list. Its other link opens the full page. A write in it refreshes the
 * page behind too (the action's refresh renders both).
 * @param props Component props.
 * @param props.children The record's page.
 * @returns The panel.
 */
export const RecordPanel = (props: { children: React.ReactNode }) => {
  const t = useTranslations('RecordPanel');
  const router = useRouter();
  const pathname = usePathname();
  // What had the focus as it opened: the row's link, or the search that opened it.
  const opener = useRef<Element>(null);
  const [closing, setClosing] = useState(false);
  const [shown, setShown] = useState(pathname);
  // Opened from its own edit page (its Cancel, the location's link): that page would stay behind
  // the panel. The address bar still names the page behind while the panel first renders.
  const [fromEdit, setFromEdit] = useState(
    () => typeof window !== 'undefined' && window.location.pathname === `${pathname}/edit`,
  );
  // Another record opened from this one is open again, even after a close that went back to it.
  if (pathname !== shown && RECORD_PATH.test(pathname)) {
    setShown(pathname);
    setClosing(false);
    setFromEdit(false);
  }
  const [, list = '/app', section = ''] = RECORD_PATH.exec(shown) ?? [];
  const kind = Object.entries(KINDS).find(([key]) => key === section)?.[1] ?? 'company';
  // That record, and a new record's form, load as the full page they are, which only a full load
  // gives (a soft navigation to them is intercepted again).
  const fullPage = fromEdit || NEW_FORM.test(pathname);
  useEffect(() => {
    if (fullPage) {
      window.location.replace(window.location.href);
    }
  }, [fullPage]);
  // The panel's node, once its portal has drawn it.
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  // A record's name takes the focus once it is drawn whenever the focus was lost meanwhile: the
  // link to another record goes with the record it was on, and a record still loading leaves the
  // focus on the panel itself. Until the viewer does something in the panel.
  useEffect(() => {
    const take = () => {
      const lost = document.activeElement === document.body || document.activeElement === node;
      if (node && lost) {
        node.querySelector<HTMLElement>(`#${kind}-heading`)?.focus();
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

  if (fullPage) {
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
        // Its record's name, then what kind of record it is (alone when there is no record).
        aria-labelledby={`${kind}-heading record-panel-kind`}
        aria-describedby={undefined}
        // The record's name takes the focus (the panel itself while it loads): a first button would
        // open its tooltip.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          opener.current = document.activeElement;
          const target = event.currentTarget;
          if (target instanceof HTMLElement) {
            (target.querySelector<HTMLElement>(`#${kind}-heading`) ?? target).focus();
          }
        }}
        // What takes Escape itself (`onEscape`: the activity composer closes on it) has it first;
        // in any other form it closes the panel.
        onEscapeKeyDown={(event) => {
          if (event.target instanceof Element && event.target.closest('[data-escape]')) {
            leaveEscapeToForm(event);
          }
        }}
        // A toast is no click outside.
        onPointerDownOutside={(event) => {
          if (event.target instanceof Element && event.target.closest('[data-sonner-toaster]')) {
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
              <a href={shown} aria-label={t('full_page')}>
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
          {props.children}
        </div>
      </SheetContent>
    </Sheet>
  );
};
