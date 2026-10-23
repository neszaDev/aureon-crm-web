import { AccountMenu } from '@/components/crm/shell/AccountMenu';
import { Wordmark } from '@/components/Wordmark';

/**
 * The frame of the pages outside any workspace (the workspace list, creating one, "not found"):
 * the wordmark and your avatar over a centred column.
 * @param props Component props.
 * @param props.user The signed-in user, when known.
 * @param props.children Page content.
 * @returns The frame.
 */
export const PickerFrame = (props: {
  user?: { id: number; email?: string; displayName?: string };
  children: React.ReactNode;
}) => (
  <div className="flex min-h-dvh flex-col">
    <header className="flex h-16 items-center justify-between gap-4 px-4 sm:px-7">
      <Wordmark href="/app" />
      {props.user?.email && (
        <AccountMenu
          userId={props.user.id}
          email={props.user.email}
          displayName={props.user.displayName}
        />
      )}
    </header>
    <main className="flex-1 px-4 pt-6 pb-16 sm:pt-12">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">{props.children}</div>
    </main>
  </div>
);
