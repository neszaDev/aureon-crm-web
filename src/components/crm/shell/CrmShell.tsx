import { useTranslations } from 'next-intl';
import { CrmLocation } from '@/components/crm/shell/CrmLocation';
import { CrmNav } from '@/components/crm/shell/CrmNav';
import { CrmBarTools, CrmRail } from '@/components/crm/shell/CrmRail';
import { CrmSidebar } from '@/components/crm/shell/CrmSidebar';
import { MobileCrmNav } from '@/components/crm/shell/MobileCrmNav';
import { WorkspaceSwitcher } from '@/components/crm/shell/WorkspaceSwitcher';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { components } from '@/libs/api/schema';
import type { BellReminders } from '@/libs/crm/Reminders';

type Schemas = components['schemas'];

/**
 * The CRM's frame, a work OS: from 768 px the ink-violet rail (Home, the reminders, search,
 * "+ New", your account) beside the workspace sidebar (switcher, spaces with their saved views,
 * insights, settings), which folds into the rail, one strip; above the page, a 48 px top bar with
 * where you are, and from 1024 px the search field "Search ⌘K" in its middle. Below 768 px the
 * rail and the sidebar are one drawer behind the top bar's menu button, and the reminders and
 * search sit in the bar. A skip link, first in the tab order, jumps to the page.
 * @param props Component props.
 * @param props.workspace The open workspace.
 * @param props.workspace.id Its id.
 * @param props.workspace.name Its name.
 * @param props.workspace.timeZone Its time zone, for the reminders' due times.
 * @param props.workspaces Every workspace the user belongs to, for the switcher.
 * @param props.user The signed-in user.
 * @param props.reminders The caller's reminders as the layout read them, the bell's first paint;
 *   undefined when they could not be read.
 * @param props.children Page content.
 * @returns The shell.
 */
export const CrmShell = (props: {
  workspace: { id: number; name: string; timeZone: string };
  workspaces: Schemas['WorkspaceSummaryResponse'][];
  user: { id: number; email: string; displayName?: string };
  reminders?: BellReminders;
  children: React.ReactNode;
}) => {
  const t = useTranslations('CrmShell');

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex min-h-dvh">
        <a
          href="#crm-main"
          className="sr-only rounded-md bg-field text-sm font-semibold text-foreground shadow-float focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus-visible:outline-on-rail"
        >
          {t('skip_to_content')}
        </a>
        <div className="sticky top-0 hidden h-dvh md:block">
          <CrmRail workspace={props.workspace} user={props.user} reminders={props.reminders} />
        </div>
        <CrmSidebar workspace={props.workspace} workspaces={props.workspaces} me={props.user.id} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* From 1024 px: where you are on the left, the search field in the middle. */}
          <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-1 border-b border-rule bg-background px-2 md:px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-4">
            <MobileCrmNav>
              <CrmRail
                workspace={props.workspace}
                user={props.user}
                reminders={props.reminders}
                drawer
              />
              <div className="flex min-w-0 flex-1 flex-col">
                {/* Clear of the drawer's close button. */}
                <div className="flex h-12 shrink-0 items-center pr-12 pl-2">
                  <WorkspaceSwitcher current={props.workspace} workspaces={props.workspaces} />
                </div>
                <CrmNav workspace={props.workspace} me={props.user.id} />
              </div>
            </MobileCrmNav>
            <CrmLocation workspace={props.workspace} />
            <CrmBarTools
              workspace={props.workspace}
              me={props.user.id}
              reminders={props.reminders}
            />
          </header>
          {/* Focusable so the skip link moves focus here in Safari too; a container needs no ring. */}
          <main
            id="crm-main"
            tabIndex={-1}
            className="min-w-0 flex-1 scroll-mt-12 px-4 pt-5 pb-12 outline-none sm:px-7"
          >
            {props.children}
          </main>
          <Toaster position="bottom-right" />
        </div>
      </div>
    </TooltipProvider>
  );
};
