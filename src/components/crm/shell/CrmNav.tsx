'use client';

import { cn } from 'cn';
import {
  Building2Icon,
  ChartNoAxesColumnIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  SettingsIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { ShellTip } from '@/components/crm/shell/ShellTip';
import type { StatusTone } from '@/libs/crm/StatusColors';
import { Link, usePathname } from '@/libs/I18nNavigation';

/** The workspace's record lists, each with its colour: the sidebar's spaces and "+ New"'s kinds. */
export const SPACES = [
  { key: 'companies', icon: Building2Icon, tone: 'blue' },
  { key: 'contacts', icon: UsersIcon, tone: 'green' },
  { key: 'leads', icon: UserPlusIcon, tone: 'amber' },
  { key: 'deals', icon: HandshakeIcon, tone: 'violet' },
  { key: 'tasks', icon: ListTodoIcon, tone: 'red' },
] as const satisfies readonly { key: string; icon: LucideIcon; tone: StatusTone }[];

// `section` is the first URL segment under the workspace (empty for its home); `href` is where
// the link lands.
const INSIGHTS = [
  { key: 'dashboard', section: '', href: '', icon: LayoutDashboardIcon },
  { key: 'reports', section: 'reports', href: '/reports', icon: ChartNoAxesColumnIcon },
] as const;

/**
 * A space's icon on a chip of its colour: its ink on its tint, which reads alone (in the strip)
 * in both themes.
 * @param props Component props.
 * @param props.space The space.
 * @returns The chip.
 */
export const SpaceChip = (props: { space: (typeof SPACES)[number] }) => (
  <span
    aria-hidden="true"
    data-tone={props.space.tone}
    className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-(--tone-tint) text-(--tone-ink)"
  >
    <props.space.icon className="size-3.5" />
  </span>
);

// The other sections' icons sit in a box the chips' size, so every label starts at one edge.
const plainIcon = (Icon: LucideIcon) => (
  <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">
    <Icon className="size-4" />
  </span>
);

const GROUP_LABEL =
  'px-2.5 pt-4 pb-1 text-xs font-medium whitespace-nowrap text-ink-2 transition-opacity duration-200 motion-reduce:transition-none strip:opacity-0';

/**
 * The workspace's sections in the sidebar: its spaces (Companies to Tasks, each on its colour),
 * its insights (Dashboard, Reports) and Settings at the foot. The current one is filled with the
 * violet tint and set in a heavier weight (a cue besides colour), and in the strip ringed in violet;
 * a hovered one only darkens. In the strip each is its icon, named in a tooltip; in the drawer the
 * sidebar is always expanded.
 * @param props Component props.
 * @param props.workspaceId The workspace the links stay in.
 * @param props.strip Whether the sidebar is its icon strip: the links' tooltips show.
 * @param props.footer What sits beside Settings: the sidebar's collapse toggle.
 * @returns The navigation.
 */
export const CrmNav = (props: {
  workspaceId: number;
  strip?: boolean;
  footer?: React.ReactNode;
}) => {
  const t = useTranslations('CrmShell');
  const spacesId = useId();
  const insightsId = useId();
  const base = `/app/${props.workspaceId}`;
  const section = usePathname().slice(base.length).split('/')[1] ?? '';

  const item = (entry: {
    label: string;
    href: string;
    current: boolean;
    icon: React.ReactNode;
  }) => (
    <li key={entry.href}>
      <ShellTip label={entry.label} active={props.strip === true}>
        <Link
          href={`${base}${entry.href}`}
          aria-current={entry.current ? 'page' : undefined}
          className={cn(
            'flex h-8 items-center gap-2.5 overflow-hidden rounded-md px-2.5 text-sm font-medium whitespace-nowrap no-underline transition-colors duration-150',
            entry.current
              ? // In the strip the icon alone can't carry the tint (1.05:1 on the sidebar): a ring.
                'bg-violet-tint font-semibold text-violet-ink strip:ring-[1.5px] strip:ring-violet-ink strip:ring-inset'
              : 'text-ink-2 hover:bg-ink/6 hover:text-foreground',
          )}
        >
          {entry.icon}
          <span className="truncate transition-opacity duration-200 motion-reduce:transition-none strip:opacity-0">
            {entry.label}
          </span>
        </Link>
      </ShellTip>
    </li>
  );

  return (
    <nav aria-label={t('nav_label')} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-2">
        <div id={spacesId} className={GROUP_LABEL}>
          {t('section_spaces')}
        </div>
        <ul aria-labelledby={spacesId} className="flex flex-col gap-0.5">
          {SPACES.map((space) =>
            item({
              label: t(`nav_${space.key}`),
              href: `/${space.key}`,
              current: section === space.key,
              icon: <SpaceChip space={space} />,
            }),
          )}
        </ul>
        <div id={insightsId} className={GROUP_LABEL}>
          {t('section_insights')}
        </div>
        <ul aria-labelledby={insightsId} className="flex flex-col gap-0.5">
          {INSIGHTS.map((insight) =>
            item({
              label: t(`nav_${insight.key}`),
              href: insight.href,
              current: section === insight.section,
              icon: plainIcon(insight.icon),
            }),
          )}
        </ul>
      </div>
      <div className="flex items-center gap-1 border-t border-rule p-2 strip:flex-col strip:items-start">
        <ul className="min-w-0 flex-1 strip:w-full">
          {item({
            label: t('nav_settings'),
            href: '/settings/workspace',
            current: section === 'settings',
            icon: plainIcon(SettingsIcon),
          })}
        </ul>
        {props.footer}
      </div>
    </nav>
  );
};
