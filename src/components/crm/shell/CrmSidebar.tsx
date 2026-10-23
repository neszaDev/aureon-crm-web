'use client';

import { ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useSyncExternalStore } from 'react';
import { CrmNav } from '@/components/crm/shell/CrmNav';
import { ShellTip } from '@/components/crm/shell/ShellTip';
import { WorkspaceSwitcher } from '@/components/crm/shell/WorkspaceSwitcher';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { isSidebarCollapsed, subscribeToSidebar, toggleSidebar } from '@/libs/crm/Sidebar';
import { useIsApple } from '@/utils/Platform';

// The backslash key: its character, or on a layout whose key gives another one (Thai), its place.
const isToggleKey = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  !event.shiftKey &&
  (event.key === '\\' || event.code === 'Backslash');

// Typing in a field keeps its own keys.
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.closest('input, textarea, select') !== null);

/**
 * The workspace sidebar beside the rail: the workspace switcher, the toggle that collapses it to
 * its 56 px icon strip (or ⌘\ / Ctrl+\ outside a field), and the sections. Its width is CSS's
 * (`strip`, from the choice on <html> or the window's width), so the first paint has the right
 * one; this reads the same state for the toggle's name and the strip's tooltips.
 * @param props Component props.
 * @param props.workspace The open workspace.
 * @param props.workspace.id Its id.
 * @param props.workspace.name Its name.
 * @param props.workspaces Every workspace the user belongs to, for the switcher.
 * @returns The sidebar.
 */
export const CrmSidebar = (props: {
  workspace: { id: number; name: string };
  workspaces: components['schemas']['WorkspaceSummaryResponse'][];
}) => {
  const t = useTranslations('CrmShell');
  const collapsed = useSyncExternalStore(subscribeToSidebar, isSidebarCollapsed, () => false);
  const apple = useIsApple();
  const label = collapsed ? t('expand_sidebar') : t('collapse_sidebar');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Below 768 px the sidebar is in the drawer, which has no strip.
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
    <div
      id="crm-sidebar"
      data-strip
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-hidden border-r border-rule bg-sidebar transition-[width] duration-200 ease-out-expo motion-reduce:transition-none md:flex strip:w-14"
    >
      <div className="flex h-12 shrink-0 items-center gap-1 px-2 strip:h-auto strip:flex-col strip:items-start strip:pt-2">
        <WorkspaceSwitcher
          current={props.workspace}
          workspaces={props.workspaces}
          strip={collapsed}
        />
        <ShellTip
          label={
            <>
              {label}
              <kbd data-slot="kbd" className="font-sans opacity-75">
                {apple ? '⌘\\' : 'Ctrl \\'}
              </kbd>
            </>
          }
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            aria-expanded={!collapsed}
            aria-controls="crm-sidebar"
            aria-keyshortcuts="Control+Backslash Meta+Backslash"
            onClick={toggleSidebar}
            className="text-ink-2 hover:bg-ink/6 aria-expanded:bg-transparent aria-expanded:hover:bg-ink/6 sm:size-7 strip:ml-1.5"
          >
            {/* Drawn by CSS, so the first paint shows the right one before React knows. */}
            <ChevronsLeftIcon className="strip:hidden" />
            <ChevronsRightIcon className="hidden strip:block" />
          </Button>
        </ShellTip>
      </div>
      <CrmNav workspaceId={props.workspace.id} strip={collapsed} />
    </div>
  );
};
