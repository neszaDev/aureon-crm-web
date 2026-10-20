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
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/libs/I18nNavigation';

// The rail's sections, in order. `section` is the first URL segment under the workspace (empty
// for its home); `href` is where the link lands. Slices add their entries here once their pages
// exist.
const crmNavItems = [
  { key: 'dashboard', section: '', href: '', icon: LayoutDashboardIcon },
  { key: 'companies', section: 'companies', href: '/companies', icon: Building2Icon },
  { key: 'contacts', section: 'contacts', href: '/contacts', icon: UsersIcon },
  { key: 'leads', section: 'leads', href: '/leads', icon: UserPlusIcon },
  { key: 'deals', section: 'deals', href: '/deals', icon: HandshakeIcon },
  { key: 'tasks', section: 'tasks', href: '/tasks', icon: ListTodoIcon },
  { key: 'reports', section: 'reports', href: '/reports', icon: ChartNoAxesColumnIcon },
  { key: 'settings', section: 'settings', href: '/settings/workspace', icon: SettingsIcon },
] as const;

/**
 * The workspace's sections on the vermilion rail, the current one filled in seal-deep and set
 * in a heavier weight (a cue besides colour).
 * @param props Component props.
 * @param props.workspaceId The workspace the links stay in.
 * @returns The navigation.
 */
export const CrmNav = (props: { workspaceId: number }) => {
  const t = useTranslations('CrmShell');
  const base = `/app/${props.workspaceId}`;
  const section = usePathname().slice(base.length).split('/')[1] ?? '';

  return (
    <nav aria-label={t('nav_label')}>
      <ul className="flex flex-col gap-0.5">
        {crmNavItems.map((item) => {
          const current = item.section === section;

          return (
            <li key={item.key}>
              <Link
                href={`${base}${item.href}`}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-9 items-center gap-2.5 rounded-md px-3 py-1.5 text-[0.9375rem] font-medium no-underline transition-colors duration-150 focus-visible:outline-on-seal',
                  current
                    ? 'bg-seal-deep font-semibold text-white'
                    : 'text-on-seal hover:bg-black/10',
                )}
              >
                <item.icon aria-hidden="true" className="size-4 shrink-0" />
                {t(`nav_${item.key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
