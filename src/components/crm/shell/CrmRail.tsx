'use client';

import { cn } from 'cn';
import { HouseIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AureonMark } from '@/components/brand/AureonMark';
import { AccountMenu } from '@/components/crm/shell/AccountMenu';
import { NewMenu } from '@/components/crm/shell/NewMenu';
import { RecordSearch } from '@/components/crm/shell/RecordSearch';
import { RemindersBell } from '@/components/crm/shell/RemindersBell';
import { ShellTip } from '@/components/crm/shell/ShellTip';
import type { BellReminders } from '@/libs/crm/Reminders';
import { Link, usePathname } from '@/libs/I18nNavigation';
import { useRailShown } from '@/utils/Viewport';

// An icon on the rail: white at 75% (9:1 on the ink violet), full white on hover, the on-rail
// focus ring (the page's violet one would sit on the rail at under 3:1).
const RAIL_BUTTON =
  'size-10 rounded-md text-on-rail/75 hover:bg-white/10 hover:text-on-rail focus-visible:ring-on-rail focus-visible:ring-offset-rail aria-expanded:bg-white/10 aria-expanded:text-on-rail sm:size-10 [&_svg:not([class*=size-])]:size-5';

/**
 * The global rail, ink violet, 56 px: the Aureon mark, Home, the reminders (the inbox), the
 * record search and "+ New", and your avatar at the foot for the account menu; a tooltip names
 * each. In the phone's drawer the reminders and the search stay in the top bar.
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
  // One of each, ever: the rail's below 768 px are the top bar's (`CrmBarTools`).
  const railShown = useRailShown();
  const tools = !props.drawer && railShown !== false;

  return (
    <nav
      aria-label={t('rail_label')}
      className="flex h-full w-14 shrink-0 flex-col items-center gap-1.5 bg-rail py-3 text-on-rail"
    >
      <AureonMark className="mb-2 size-7 text-on-rail" />
      <ShellTip label={t('nav_home')}>
        <Link
          href={base}
          aria-label={t('nav_home')}
          aria-current={home ? 'page' : undefined}
          className={cn(
            'grid place-items-center outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2',
            RAIL_BUTTON,
            // The fill is 2.71:1 on the rail: a light ring carries the 3:1.
            home && 'bg-violet text-white ring-1 ring-on-rail/50 ring-inset hover:bg-violet',
          )}
        >
          <HouseIcon className="size-5" />
        </Link>
      </ShellTip>
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
          <RecordSearch workspaceId={props.workspace.id} side="right" className={RAIL_BUTTON} />
        </>
      )}
      <NewMenu
        workspaceId={props.workspace.id}
        className="mt-1 size-9 rounded-full bg-on-rail text-rail hover:bg-on-rail/85 focus-visible:ring-on-rail focus-visible:ring-offset-rail sm:size-9"
      />
      <div className="mt-auto">
        <AccountMenu
          userId={props.user.id}
          email={props.user.email}
          displayName={props.user.displayName}
          workspaceId={props.workspace.id}
          side="right"
          className="focus-visible:outline-on-rail"
        />
      </div>
    </nav>
  );
};

/**
 * Below 768 px, the rail's reminders and record search in the top bar.
 * @param props Component props.
 * @param props.workspace The open workspace.
 * @param props.workspace.id Its id.
 * @param props.workspace.timeZone Its time zone, for the reminders' due times.
 * @param props.me The caller's user id, for the link to their tasks.
 * @param props.reminders The caller's reminders as the layout read them.
 * @returns The two buttons.
 */
export const CrmBarTools = (props: {
  workspace: { id: number; timeZone: string };
  me: number;
  reminders?: BellReminders;
}) => {
  const railShown = useRailShown();
  if (railShown === true) {
    return null;
  }

  return (
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
  );
};
