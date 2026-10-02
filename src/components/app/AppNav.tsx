'use client';

import { cn } from 'cn';
import { ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Link, usePathname } from '@/libs/I18nNavigation';
import { useNavSections } from './navItems';
import type { NavGroup, NavLink } from './navItems';

const itemClass =
  'flex h-9 w-full items-center gap-3 rounded-md px-3 text-[0.9375rem] font-medium no-underline transition-colors focus-visible:outline-folder-ink';
const idleClass = 'text-folder-ink-soft hover:bg-white/8 hover:text-folder-ink';
const currentClass = 'bg-folder-deep text-folder-ink shadow-[inset_0_1px_0_rgb(255_255_255/6%)]';

const isGroup = (entry: NavLink | NavGroup): entry is NavGroup => 'items' in entry;

/**
 * One sidebar link, marked when it is the current page.
 * @param props Component props.
 * @param props.item The link.
 * @param props.pathname The current path, without a trailing slash.
 * @param props.nested Whether it sits inside a group (indented, no icon).
 * @param props.prefetch Whether Next.js prefetches the page while the link is visible.
 * @returns The list item.
 */
const NavItem = (props: {
  item: NavLink;
  pathname: string;
  nested?: boolean;
  prefetch?: false;
}) => {
  const current = props.pathname === props.item.href;
  const Icon = props.item.icon;

  return (
    <li>
      <Link
        href={`${props.item.href}/`}
        prefetch={props.prefetch}
        aria-current={current ? 'page' : undefined}
        className={cn(
          itemClass,
          props.nested && 'pl-10 text-sm',
          current ? currentClass : idleClass,
        )}
      >
        {Icon && <Icon aria-hidden="true" className="size-[1.125rem] shrink-0" />}
        {props.item.label}
      </Link>
    </li>
  );
};

/**
 * The app's sections, with the current page marked and its group open.
 * @param props Component props.
 * @param props.isAdmin Whether the signed-in user may manage users.
 * @returns The navigation list.
 */
export const AppNav = (props: { isAdmin: boolean }) => {
  const t = useTranslations('AppNav');
  const pathname = usePathname().replace(/\/$/u, '');
  const navSections = useNavSections({ isAdmin: props.isAdmin });

  return (
    <nav aria-label={t('nav_label')} className="flex flex-col gap-5">
      {navSections.map((section) => {
        // Only the product's own pages are prefetched. Every dashboard prefetch renders the
        // layout, which reads the session from the backend; prefetching the ~25 visible demo
        // links on each page view would flood it (and race on token refresh).
        const prefetch = section.id === 'main' ? undefined : false;

        return (
          <div key={section.id} className="flex flex-col gap-1.5">
            {section.title && (
              <h2 className="px-3 text-[0.6875rem] font-semibold tracking-[0.12em] text-folder-ink-soft uppercase">
                {section.title}
              </h2>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.entries.map((entry) => {
                if (!isGroup(entry)) {
                  return (
                    <NavItem
                      key={entry.href}
                      item={entry}
                      pathname={pathname}
                      prefetch={prefetch}
                    />
                  );
                }
                const inside = pathname.startsWith(`${entry.base}/`);

                return (
                  <li key={entry.base}>
                    <Collapsible defaultOpen={inside}>
                      <CollapsibleTrigger
                        className={cn(itemClass, 'group', inside ? 'text-folder-ink' : idleClass)}
                      >
                        <entry.icon aria-hidden="true" className="size-[1.125rem] shrink-0" />
                        {entry.label}
                        <ChevronRightIcon
                          aria-hidden="true"
                          className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]:rotate-90"
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="mt-0.5 flex flex-col gap-0.5">
                          {entry.items.map((item) => (
                            <NavItem
                              key={item.href}
                              item={item}
                              pathname={pathname}
                              prefetch={prefetch}
                              nested
                            />
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
};
