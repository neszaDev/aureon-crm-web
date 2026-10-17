import { useTranslations } from 'next-intl';
import { AccountMenu } from '@/components/crm/shell/AccountMenu';
import { CrmNav } from '@/components/crm/shell/CrmNav';
import { MobileCrmNav } from '@/components/crm/shell/MobileCrmNav';
import { WorkspaceSwitcher } from '@/components/crm/shell/WorkspaceSwitcher';
import { WorkspaceMark } from '@/components/crm/WorkspaceMark';
import { Toaster } from '@/components/ui/sonner';
import type { components } from '@/libs/api/schema';

type Schemas = components['schemas'];

/**
 * The CRM's frame: the vermilion seal rail (workspace switcher, sections) on large screens, a
 * vermilion bar opening the rail as a drawer below that, and your seal for the account menu. A
 * skip link, first in the tab order, jumps past the rail to the page.
 * @param props Component props.
 * @param props.workspace The open workspace.
 * @param props.workspace.id Its id.
 * @param props.workspace.name Its name.
 * @param props.workspaces Every workspace the user belongs to, for the switcher.
 * @param props.user The signed-in user.
 * @param props.children Page content.
 * @returns The shell.
 */
export const CrmShell = (props: {
  workspace: { id: number; name: string };
  workspaces: Schemas['WorkspaceSummaryResponse'][];
  user: { email: string; displayName?: string };
  children: React.ReactNode;
}) => {
  const t = useTranslations('CrmShell');
  const rail = (
    <div className="flex h-full flex-col gap-6 px-2.5 py-4">
      <WorkspaceSwitcher current={props.workspace} workspaces={props.workspaces} />
      <div className="-mx-2.5 min-h-0 flex-1 [scrollbar-color:rgb(255_255_255/25%)_transparent] overflow-y-auto px-2.5">
        <CrmNav workspaceId={props.workspace.id} />
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[14.5rem_minmax(0,1fr)]">
      <a
        href="#crm-main"
        className="sr-only rounded-md bg-field text-sm font-semibold text-foreground shadow-sheet focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus-visible:outline-on-seal"
      >
        {t('skip_to_content')}
      </a>
      <aside className="hidden bg-seal text-on-seal lg:block">
        <div className="sticky top-0 h-dvh">{rail}</div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-seal px-2 text-on-seal lg:static lg:bg-transparent lg:px-7 lg:pt-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
            <MobileCrmNav>{rail}</MobileCrmNav>
            <WorkspaceMark name={props.workspace.name} tone="rail" className="size-7" />
            <span className="truncate text-[0.9375rem] font-bold">{props.workspace.name}</span>
          </div>
          <AccountMenu
            email={props.user.email}
            displayName={props.user.displayName}
            workspaceId={props.workspace.id}
            className="ml-auto focus-visible:outline-on-seal lg:focus-visible:outline-ring"
          />
        </header>
        {/* Focusable so the skip link moves focus here in Safari too; a container needs no ring. */}
        <main
          id="crm-main"
          tabIndex={-1}
          className="min-w-0 flex-1 scroll-mt-14 px-4 pt-5 pb-12 outline-none sm:px-7 lg:scroll-mt-0 lg:pt-1"
        >
          {props.children}
        </main>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
};
