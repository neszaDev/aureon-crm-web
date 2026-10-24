'use client';

import { cn } from 'cn';
import { HouseIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AureonMark } from '@/components/brand/AureonMark';
import { AccountMenu } from '@/components/crm/shell/AccountMenu';
import { CrmStrip, RAIL_BUTTON, RailLink } from '@/components/crm/shell/CrmStrip';
import { NewMenu } from '@/components/crm/shell/NewMenu';
import { RecordSearch } from '@/components/crm/shell/RecordSearch';
import { RemindersBell } from '@/components/crm/shell/RemindersBell';
import type { BellReminders } from '@/libs/crm/Reminders';
import { usePathname } from '@/libs/I18nNavigation';
import { useRailShown, useSearchField } from '@/utils/Viewport';

/**
 * The global rail, ink violet, 56 px: the Aureon mark, Home, the inbox (your reminders), the
 * record search (below 1024 px; the top bar's field from there) and "+ New"; while the sidebar is
 * folded, the workspace's sections (`CrmStrip`); your avatar at the foot for the account menu. A
 * tooltip names each. In the phone's drawer the inbox and the search stay in the top bar, and the
 * sidebar beside it is always open.
 * @param props Component props.
 * @param props.workspace The open workspace.
 * @param props.workspace.id Its id.
 * @param props.workspace.timeZone Its time zone, for the reminders' due times.
 * @param props.user The signed-in user.
 * @param props.reminders The caller's reminders as the layout read them.
 * @param props.drawer Whether it is the phone drawer's copy.
 * @returns The rail.
 */
export const CrmRail = (props: {
  workspace: { id: number; timeZone: string };
  user: { id: number; email: string; displayName?: string };
  reminders?: BellReminders;
  drawer?: boolean;
}) => {
  const t = useTranslations('CrmShell');
  const base = `/app/${props.workspace.id}`;
  const home = usePathname() === base;
  // One of each, ever: the rail's below 768 px are the top bar's (`CrmBarTools`), and its search
  // from 1024 px is the top bar's field.
  const railShown = useRailShown();
  const tools = !props.drawer && railShown !== false;
  const searchField = useSearchField();

  return (
    <div className="flex h-full w-14 shrink-0 flex-col items-center gap-1.5 bg-rail py-3 text-on-rail">
      <nav aria-label={t('rail_label')} className="flex flex-col items-center gap-1.5">
        <AureonMark className="mb-2 size-7 text-on-rail" />
        <RailLink label={t('nav_home')} href={base} current={home}>
          <HouseIcon className="size-5" />
        </RailLink>
        {tools && (
          <>
            <RemindersBell
              workspaceId={props.workspace.id}
              me={props.user.id}
              timeZone={props.workspace.timeZone}
              reminders={props.reminders}
              side="right"
              className={RAIL_BUTTON}
            />
            {searchField !== true && (
              <RecordSearch
                workspaceId={props.workspace.id}
                side="right"
                className={cn(RAIL_BUTTON, 'lg:hidden')}
              />
            )}
          </>
        )}
        <NewMenu
          workspaceId={props.workspace.id}
          className="mt-1 size-9 rounded-full bg-on-rail text-rail hover:bg-on-rail/85 focus-visible:ring-on-rail focus-visible:ring-offset-rail sm:size-9"
        />
      </nav>
      {!props.drawer && <CrmStrip workspaceId={props.workspace.id} />}
      <div className="mt-auto shrink-0 pt-1.5">
        <AccountMenu
          userId={props.user.id}
          email={props.user.email}
          displayName={props.user.displayName}
          workspaceId={props.workspace.id}
          side="right"
          className="focus-visible:outline-on-rail"
        />
      </div>
    </div>
  );
};

/**
 * The record search and the inbox in the top bar: below 768 px both as icons (the rail's are off
 * screen), and from 1024 px the search as a field, centred.
 * @param props Component props.
 * @param props.workspace The open workspace.
 * @param props.workspace.id Its id.
 * @param props.workspace.timeZone Its time zone, for the reminders' due times.
 * @param props.me The caller's user id, for the link to their tasks.
 * @param props.reminders The caller's reminders as the layout read them.
 * @returns The tools.
 */
export const CrmBarTools = (props: {
  workspace: { id: number; timeZone: string };
  me: number;
  reminders?: BellReminders;
}) => {
  const railShown = useRailShown();
  const searchField = useSearchField();

  return (
    <>
      {searchField !== false && (
        <RecordSearch
          workspaceId={props.workspace.id}
          side="bottom"
          field
          className="hidden w-80 lg:flex xl:w-96"
        />
      )}
      {railShown !== true && (
        <div className="flex items-center gap-1 md:hidden">
          <RecordSearch workspaceId={props.workspace.id} side="bottom" />
          <RemindersBell
            workspaceId={props.workspace.id}
            me={props.me}
            timeZone={props.workspace.timeZone}
            reminders={props.reminders}
            side="bottom"
          />
        </div>
      )}
    </>
  );
};
