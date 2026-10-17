import { AccountMenu } from '@/components/crm/shell/AccountMenu';
import { CrmNav } from '@/components/crm/shell/CrmNav';
import { MobileCrmNav } from '@/components/crm/shell/MobileCrmNav';
import { WorkspaceSwitcher } from '@/components/crm/shell/WorkspaceSwitcher';
import { WorkspaceMark } from '@/components/crm/WorkspaceMark';
import type { components } from '@/libs/api/schema';

type Schemas = components['schemas'];

/**
 * The CRM's frame: the vermilion seal rail (workspace switcher, sections) on large screens, a
 * vermilion bar opening the rail as a drawer below that, and your seal for the account menu.
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
        <main className="min-w-0 flex-1 px-4 pt-5 pb-12 sm:px-7 lg:pt-1">{props.children}</main>
      </div>
    </div>
  );
};
