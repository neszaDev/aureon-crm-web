'use client';

import { cn } from 'cn';
import { ClipboardListIcon, LayoutGridIcon, UserRoundIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/libs/I18nNavigation';

/**
 * The app's sections, with the current one marked.
 * @returns The navigation list.
 */
export const AppNav = () => {
  const t = useTranslations('DashboardLayout');
  const pathname = usePathname().replace(/\/$/u, '');
  const items = [
    { href: '/dashboard', label: t('dashboard_link'), icon: LayoutGridIcon },
    { href: '/dashboard/test-results', label: t('test_results_link'), icon: ClipboardListIcon },
    { href: '/dashboard/account', label: t('account_link'), icon: UserRoundIcon },
  ];

  return (
    <nav aria-label={t('nav_label')}>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const current = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={`${item.href}/`}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-[0.9375rem] font-medium no-underline transition-colors focus-visible:outline-folder-ink',
                  current
                    ? 'bg-folder-deep text-folder-ink shadow-[inset_0_1px_0_rgb(255_255_255/6%)]'
                    : 'text-folder-ink-soft hover:bg-white/8 hover:text-folder-ink',
                )}
              >
                <item.icon aria-hidden="true" className="size-[1.125rem] shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
