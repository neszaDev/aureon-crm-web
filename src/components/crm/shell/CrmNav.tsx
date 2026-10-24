'use client';

import { cn } from 'cn';
import {
  Building2Icon,
  ChartNoAxesColumnIcon,
  ChevronRightIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  SettingsIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useSyncExternalStore } from 'react';
import { Satellite } from '@/components/brand/AureonMark';
import { subscribeToSidebar, toggleSpace } from '@/libs/crm/Sidebar';
import type { StatusTone } from '@/libs/crm/StatusColors';
import { todayIn } from '@/libs/crm/ZonedTime';
import { Link, usePathname, useSearchParams } from '@/libs/I18nNavigation';

/** The workspace's record lists, each with its colour: the sidebar's spaces and "+ New"'s kinds. */
export const SPACES = [
  { key: 'companies', icon: Building2Icon, tone: 'blue' },
  { key: 'contacts', icon: UsersIcon, tone: 'green' },
  { key: 'leads', icon: UserPlusIcon, tone: 'amber' },
  { key: 'deals', icon: HandshakeIcon, tone: 'violet' },
  { key: 'tasks', icon: ListTodoIcon, tone: 'red' },
] as const satisfies readonly { key: string; icon: LucideIcon; tone: StatusTone }[];

type Space = (typeof SPACES)[number]['key'];

/** A section of the workspace with a link in the sidebar: a space, an insight or Settings. */
export type Section = Space | 'dashboard' | 'reports' | 'settings';

/**
 * The workspace's other sections: its insights, then Settings. `section` is the first URL segment
 * under the workspace; `href` is where the link lands. The workspace's home is the rail's Home.
 */
export const INSIGHTS = [
  { key: 'dashboard', section: 'dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { key: 'reports', section: 'reports', href: '/reports', icon: ChartNoAxesColumnIcon },
] as const;
export const SETTINGS = {
  key: 'settings',
  section: 'settings',
  href: '/settings/workspace',
  icon: SettingsIcon,
} as const;

/**
 * The section of the workspace a path is in: its first segment under the workspace.
 * @param path The page's path, without its locale.
 * @param base The workspace's path.
 * @returns The section, such as `deals`; empty on the home.
 */
export const sectionOf = (path: string, base: string) =>
  path.slice(base.length).split('/')[1] ?? '';

// The leads a follow-up is due for: the open ones, as the follow-up report links them.
const OPEN_LEADS = ['NEW', 'CONTACTED', 'QUALIFIED'];

type View = {
  key:
    | 'all'
    | 'mine'
    | 'archived'
    | 'follow_up'
    | 'board'
    | 'list'
    | 'my_tasks'
    | 'overdue'
    | 'week'
    | 'completed';
  params: Record<string, string | string[]>;
};

/**
 * A space's saved views in the sidebar's tree: its list at a URL, as the list's own toolbar writes
 * it (no reads of their own, no counts).
 * @param space The space.
 * @param me The caller's user id, for their own records.
 * @param today Today in the workspace's time zone, for the follow-ups due.
 * @returns The views, in order.
 */
const viewsOf = (space: Space, me: number, today: string): View[] => {
  const all: View = { key: 'all', params: {} };
  const mine: View = { key: 'mine', params: { ownerId: String(me) } };
  const records: View[] = [all, mine, { key: 'archived', params: { archived: 'true' } }];
  const followUp: View = {
    key: 'follow_up',
    params: { status: OPEN_LEADS, followUpBefore: today, sort: 'FOLLOW_UP_DATE', direction: 'ASC' },
  };
  const views: Record<Space, View[]> = {
    companies: records,
    contacts: records,
    leads: [all, mine, followUp],
    deals: [{ key: 'board', params: {} }, { key: 'list', params: { view: 'list' } }, mine],
    tasks: [
      { key: 'my_tasks', params: { assigneeId: String(me) } },
      { key: 'overdue', params: { view: 'overdue' } },
      { key: 'week', params: { view: 'week' } },
      { key: 'completed', params: { view: 'completed' } },
    ],
  };

  return views[space];
};

const queryOf = (params: View['params']) =>
  new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => [value].flat().map((item) => [key, item])),
  ).toString();

/**
 * The view a list's URL is on: of those whose every param it carries (with the same values), the
 * one with the most, the first of equals. Its other params (a search, a sort) change nothing.
 * @param views The space's views.
 * @param search The list's query.
 * @returns The view's key, or none.
 */
const currentView = (views: View[], search: URLSearchParams) => {
  let best: View | undefined;
  for (const view of views) {
    const entries = Object.entries(view.params);
    const matches = entries.every(([key, value]) => {
      const wanted = [value].flat();
      const given = search.getAll(key);
      return given.length === wanted.length && wanted.every((item) => given.includes(item));
    });
    if (matches && (!best || entries.length > Object.keys(best.params).length)) {
      best = view;
    }
  }

  return best?.key;
};

/**
 * A space's icon on a chip of its colour: its ink on its tint, which reads alone in both themes.
 * Named by its key, so a server component can draw one too (this module is the client's: `SPACES`
 * itself doesn't reach the server).
 * @param props Component props.
 * @param props.space The space's key, such as `leads`.
 * @returns The chip.
 */
export const SpaceChip = (props: { space: Space }) => {
  const space = SPACES.find((item) => item.key === props.space);

  return (
    space && (
      <span
        aria-hidden="true"
        data-tone={space.tone}
        className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-(--tone-tint) text-(--tone-ink)"
      >
        <space.icon className="size-3.5" />
      </span>
    )
  );
};

// The other sections' icons sit in a box the chips' size, so every label starts at one edge.
const plainIcon = (Icon: LucideIcon) => (
  <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">
    <Icon className="size-4" />
  </span>
);

const GROUP_LABEL = 'px-2.5 pt-4 pb-1 text-xs font-medium whitespace-nowrap text-ink-2';

// A link's look by its `aria-current`: the page's is filled with the violet tint and set heavier (a
// cue besides colour); a space holding the current view is set heavier in violet, its view filled
// (global.css fills the space itself while it is closed).
const LOOK = {
  page: 'bg-violet-tint font-semibold text-violet-ink',
  true: 'font-semibold text-violet-ink hover:bg-ink/6',
  none: 'text-ink-2 hover:bg-ink/6 hover:text-foreground',
};
type Current = keyof typeof LOOK;

/**
 * The workspace's sections in the sidebar (and the phone's drawer): its spaces (Companies to Tasks,
 * each on its colour, each opening to its saved views), its insights (Dashboard, Reports) and
 * Settings at the foot. The page's own link is marked current (`aria-current="page"`): the most
 * specific view its URL matches, else its section; a space holding the current view says so
 * (`"true"`). The current section's icon carries the orbit's satellite. Which spaces are open is
 * the viewer's, kept in their browser; global.css shows their views from the first paint
 * (`data-spaces` on `<html>`).
 * @param props Component props.
 * @param props.workspace The workspace the links stay in.
 * @param props.workspace.id Its id.
 * @param props.workspace.timeZone Its time zone, for the follow-ups due today.
 * @param props.me The caller's user id, for the views of their own records.
 * @param props.footer What sits beside Settings: the sidebar's collapse toggle.
 * @returns The navigation.
 */
export const CrmNav = (props: {
  workspace: { id: number; timeZone: string };
  me: number;
  footer?: React.ReactNode;
}) => {
  const t = useTranslations('CrmShell');
  const spacesId = useId();
  const insightsId = useId();
  const treeId = useId();
  const base = `/app/${props.workspace.id}`;
  const path = usePathname();
  const search = useSearchParams();
  const section = sectionOf(path, base);
  // The open spaces, for their toggles; none on the server (global.css shows their views anyway).
  const open = useSyncExternalStore(
    subscribeToSidebar,
    () => document.documentElement.dataset.spaces ?? '',
    () => '',
  ).split(' ');
  const today = todayIn(props.workspace.timeZone);

  const link = (entry: {
    label: string;
    href: string;
    current: Current;
    icon: React.ReactNode;
  }) => (
    <Link
      href={`${base}${entry.href}`}
      aria-current={entry.current === 'none' ? undefined : entry.current}
      className={cn(
        'flex h-8 items-center gap-2.5 overflow-hidden rounded-md px-2.5 text-sm font-medium whitespace-nowrap no-underline transition-colors duration-150',
        LOOK[entry.current],
      )}
    >
      <span className="relative flex shrink-0">
        {entry.icon}
        {entry.current !== 'none' && <Satellite className="-top-1 -right-1 text-violet-ink" />}
      </span>
      <span className="truncate">{entry.label}</span>
    </Link>
  );
  const other = (entry: typeof SETTINGS | (typeof INSIGHTS)[number]) => (
    <li key={entry.key}>
      {link({
        label: t(`nav_${entry.key}`),
        href: entry.href,
        current: section === entry.section ? 'page' : 'none',
        icon: plainIcon(entry.icon),
      })}
    </li>
  );

  return (
    <nav aria-label={t('nav_label')} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-2">
        <div id={spacesId} className={GROUP_LABEL}>
          {t('section_spaces')}
        </div>
        <ul aria-labelledby={spacesId} className="flex flex-col gap-0.5">
          {SPACES.map((space) => {
            const views = viewsOf(space.key, props.me, today);
            // A view only on the list's own page: on a record the space itself is current.
            const view = path === `${base}/${space.key}` ? currentView(views, search) : undefined;
            let current: Current = 'none';
            if (section === space.key) {
              current = view ? 'true' : 'page';
            }
            const label = t(`nav_${space.key}`);
            const listId = `${treeId}${space.key}`;

            return (
              <li key={space.key}>
                <div className="relative" data-space={space.key}>
                  {link({
                    label,
                    href: `/${space.key}`,
                    current,
                    icon: <SpaceChip space={space.key} />,
                  })}
                  <button
                    id={`${listId}-toggle`}
                    type="button"
                    data-views-toggle={space.key}
                    aria-expanded={open.includes(space.key)}
                    aria-controls={listId}
                    aria-label={t('space_views', { space: label })}
                    onClick={() => {
                      toggleSpace(space.key);
                    }}
                    className="absolute top-1 right-1 grid size-6 place-items-center rounded-[5px] text-ink-2 transition-colors duration-150 hover:bg-ink/8 hover:text-foreground"
                  >
                    <ChevronRightIcon aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
                {/* Shown by global.css while the space is open. */}
                <ul
                  id={listId}
                  data-views={space.key}
                  aria-labelledby={`${listId}-toggle`}
                  className="ml-[1.1875rem] flex-col gap-0.5 border-l border-rule py-0.5 pl-2"
                >
                  {views.map((entry) => {
                    const query = queryOf(entry.params);
                    return (
                      <li key={entry.key}>
                        <Link
                          href={`${base}/${space.key}${query ? `?${query}` : ''}`}
                          aria-current={view === entry.key ? 'page' : undefined}
                          className={cn(
                            'flex h-7 items-center rounded-md px-2.5 text-[0.8125rem] font-medium whitespace-nowrap no-underline transition-colors duration-150',
                            LOOK[view === entry.key ? 'page' : 'none'],
                          )}
                        >
                          <span className="truncate">{t(`view_${entry.key}`)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
        <div id={insightsId} className={GROUP_LABEL}>
          {t('section_insights')}
        </div>
        <ul aria-labelledby={insightsId} className="flex flex-col gap-0.5">
          {INSIGHTS.map(other)}
        </ul>
      </div>
      <div className="flex items-center gap-1 border-t border-rule p-2">
        <ul className="min-w-0 flex-1">{other(SETTINGS)}</ul>
        {props.footer}
      </div>
    </nav>
  );
};
