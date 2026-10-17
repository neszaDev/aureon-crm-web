'use client';

import { cn } from 'cn';
import {
  Building2Icon,
  ListOrderedIcon,
  ShieldCheckIcon,
  SignpostIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/libs/I18nNavigation';

// The settings pages, in order; the last one is about you, not the workspace. F3 adds Audit
// (for `AUDIT_READ`) before it once its page exists.
const settingsNavItems = [
  { key: 'workspace', icon: Building2Icon },
  { key: 'members', icon: UsersRoundIcon },
  { key: 'roles', icon: ShieldCheckIcon },
  { key: 'pipeline', icon: ListOrderedIcon },
  { key: 'sources', icon: SignpostIcon },
  { key: 'profile', icon: UserRoundIcon },
] as const;

/**
 * The settings pages: a column beside the page on large screens, a wrapping row of links above
 * it on smaller ones. The current page is filled with the seal tint.
 * @param props Component props.
 * @param props.workspaceId The `[workspaceId]` route segment.
 * @returns The navigation.
 */
export const SettingsNav = (props: { workspaceId: string }) => {
  const t = useTranslations('SettingsNav');
  const base = `/app/${props.workspaceId}/settings`;
  const page = usePathname().slice(base.length).split('/')[1] ?? '';

  return (
    <nav aria-label={t('label')} className="xl:sticky xl:top-6">
      <ul className="flex flex-wrap gap-1.5 xl:flex-col xl:gap-0.5">
        {settingsNavItems.map((item) => {
          const current = item.key === page;

          return (
            <li
              key={item.key}
              className={cn(item.key === 'profile' && 'xl:mt-3 xl:border-t xl:border-rule xl:pt-3')}
            >
              <Link
                href={`${base}/${item.key}`}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-9 items-center gap-2 rounded-md border px-3 py-1.5 text-[0.9375rem] font-medium no-underline transition-colors duration-150 xl:border-transparent xl:px-2.5',
                  current
                    ? 'border-seal-ink/25 bg-seal-tint font-semibold text-seal-ink'
                    : 'border-rule bg-card text-foreground hover:bg-muted xl:bg-transparent',
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
