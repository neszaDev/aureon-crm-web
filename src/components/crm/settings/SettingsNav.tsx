'use client';

import { cn } from 'cn';
import {
  Building2Icon,
  ListOrderedIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  SignpostIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/libs/I18nNavigation';

// The settings pages, in order; the last one is about you, not the workspace.
const settingsNavItems = [
  { key: 'workspace', icon: Building2Icon },
  { key: 'members', icon: UsersRoundIcon },
  { key: 'roles', icon: ShieldCheckIcon },
  { key: 'pipeline', icon: ListOrderedIcon },
  { key: 'sources', icon: SignpostIcon },
  { key: 'audit', icon: ScrollTextIcon },
  { key: 'profile', icon: UserRoundIcon },
] as const;

// On a phone the tabs scroll sideways: the current one is brought to the middle of their row,
// which alone scrolls (`scrollIntoView` would scroll the page too).
const showCurrent = (node: HTMLAnchorElement | null) => {
  const row = node?.closest('ul');
  if (node && row) {
    row.scrollLeft = node.offsetLeft - row.offsetLeft - (row.clientWidth - node.offsetWidth) / 2;
  }
};

/**
 * The settings pages, inside the canvas: a column of links beside the page from 1024 px, the
 * sidebar's way (the current one on the violet tint); a row of tabs above it on smaller screens,
 * which scrolls sideways rather than wrap (the current one underlined in violet).
 * @param props Component props.
 * @param props.workspaceId The `[workspaceId]` route segment.
 * @param props.audit Whether the caller may read the audit trail (`AUDIT_READ`): its link shows.
 * @returns The navigation.
 */
export const SettingsNav = (props: { workspaceId: string; audit: boolean }) => {
  const t = useTranslations('SettingsNav');
  const base = `/app/${props.workspaceId}/settings`;
  const page = usePathname().slice(base.length).split('/')[1] ?? '';

  return (
    <nav aria-label={t('label')} className="lg:sticky lg:top-6">
      <ul className="-mx-1 flex gap-1 overflow-x-auto border-b border-rule px-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-0 lg:px-0">
        {settingsNavItems.map((item) => {
          if (item.key === 'audit' && !props.audit) {
            return null;
          }
          const current = item.key === page;

          return (
            <li
              key={item.key}
              className={cn(
                'shrink-0',
                item.key === 'profile' && 'lg:mt-3 lg:border-t lg:border-rule lg:pt-3',
              )}
            >
              <Link
                href={`${base}/${item.key}`}
                aria-current={current ? 'page' : undefined}
                ref={current ? showCurrent : undefined}
                className={cn(
                  // Its outline drawn inside: the row's scroll box would clip it.
                  'flex h-9 items-center gap-2.5 border-b-2 px-2 text-[0.8125rem] font-medium whitespace-nowrap no-underline transition-colors duration-150 focus-visible:-outline-offset-2 lg:h-8 lg:rounded-md lg:border-b-0 lg:px-2.5 lg:text-sm',
                  current
                    ? 'border-violet-ink text-foreground lg:bg-violet-tint lg:font-semibold lg:text-violet-ink'
                    : 'border-transparent text-muted-foreground hover:text-foreground lg:text-ink-2 lg:hover:bg-ink/6',
                )}
              >
                <item.icon aria-hidden="true" className="size-4 shrink-0 max-lg:hidden" />
                {t(`nav_${item.key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
