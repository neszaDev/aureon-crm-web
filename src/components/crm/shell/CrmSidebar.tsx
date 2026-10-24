'use client';

import { ChevronsLeftIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect } from 'react';
import { CrmNav } from '@/components/crm/shell/CrmNav';
import { ShellTip } from '@/components/crm/shell/ShellTip';
import { WorkspaceSwitcher } from '@/components/crm/shell/WorkspaceSwitcher';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { applyStoredSidebar, SIDEBAR_COLLAPSE_ID, toggleSidebar } from '@/libs/crm/Sidebar';
import { useIsApple } from '@/utils/Platform';

// The backslash key: its character, or on a layout whose key gives another one (Thai), its place.
// Once per press: a held key's repeats would flicker the sidebar.
const isToggleKey = (event: KeyboardEvent) =>
  !event.repeat &&
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  !event.shiftKey &&
  (event.key === '\\' || event.code === 'Backslash');

// Typing in a field keeps its own keys.
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.closest('input, textarea, select') !== null);

/**
 * The keyboard shortcut that folds and expands the sidebar, as a tooltip writes it.
 * @returns `⌘\` on Apple devices, else `Ctrl \`.
 */
export const useSidebarKeys = () => (useIsApple() ? '⌘\\' : 'Ctrl \\');

/**
 * The workspace sidebar beside the rail: the workspace switcher, the sections, and the toggle that
 * folds it into the rail (or ⌘\ / Ctrl+\ outside a field), which then shows the sections as its own
 * strip of icons (`CrmStrip`) and the toggle that expands it again. Folded, it is gone, width and
 * all; its state is CSS's (`strip`, from the choice on <html> or the window's width), so the first
 * paint has the right one.
 * @param props Component props.
 * @param props.workspace The open workspace.
 * @param props.workspace.id Its id.
 * @param props.workspace.name Its name.
 * @param props.workspace.timeZone Its time zone, for the follow-ups due today.
 * @param props.workspaces Every workspace the user belongs to, for the switcher.
 * @param props.me The caller's user id, for the views of their own records.
 * @returns The sidebar.
 */
export const CrmSidebar = (props: {
  workspace: { id: number; name: string; timeZone: string };
  workspaces: components['schemas']['WorkspaceSummaryResponse'][];
  me: number;
}) => {
  const t = useTranslations('CrmShell');
  const keys = useSidebarKeys();

  useLayoutEffect(applyStoredSidebar, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Below 768 px the sidebar is in the drawer, which doesn't fold.
      if (isToggleKey(event) && !isTyping(event.target) && matchMedia('(width >= 48rem)').matches) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    // Folded: no width, and hidden once it has shrunk (its links leave the tab order).
    <div
      id="crm-sidebar"
      data-strip
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-hidden border-r border-rule bg-sidebar transition-[width,visibility] duration-200 ease-out-expo motion-reduce:transition-none md:flex strip:invisible strip:w-0 strip:border-r-0"
    >
      <div className="flex h-12 shrink-0 items-center px-2">
        <WorkspaceSwitcher current={props.workspace} workspaces={props.workspaces} />
      </div>
      <CrmNav
        workspace={props.workspace}
        me={props.me}
        // Beside Settings, so the workspace's name has the head's width.
        footer={
          <ShellTip
            label={
              <>
                {t('collapse_sidebar')}
                <kbd data-slot="kbd" className="font-sans opacity-75">
                  {keys}
                </kbd>
              </>
            }
          >
            <Button
              variant="ghost"
              size="icon-sm"
              id={SIDEBAR_COLLAPSE_ID}
              aria-label={t('collapse_sidebar')}
              aria-expanded
              aria-controls="crm-sidebar"
              aria-keyshortcuts="Control+\ Meta+\"
              onClick={toggleSidebar}
              className="text-ink-2 hover:bg-ink/6 aria-expanded:bg-transparent aria-expanded:hover:bg-ink/6 sm:size-7"
            >
              <ChevronsLeftIcon />
            </Button>
          </ShellTip>
        }
      />
    </div>
  );
};
