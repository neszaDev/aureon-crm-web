'use client';

import { cn } from 'cn';
import { ChevronsRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Satellite } from '@/components/brand/AureonMark';
import type { Section } from '@/components/crm/shell/CrmNav';
import { INSIGHTS, SETTINGS, sectionOf, SPACES } from '@/components/crm/shell/CrmNav';
import { useSidebarKeys } from '@/components/crm/shell/CrmSidebar';
import { ShellTip } from '@/components/crm/shell/ShellTip';
import { Button } from '@/components/ui/button';
import { toggleSidebar } from '@/libs/crm/Sidebar';
import { Link, usePathname } from '@/libs/I18nNavigation';

// An icon on the rail: white at 75% (9:1 on the ink violet), full white on hover, the on-rail
// focus ring (the page's violet one would sit on the rail at under 3:1).
export const RAIL_BUTTON =
  'size-10 shrink-0 rounded-md text-on-rail/75 hover:bg-white/10 hover:text-on-rail focus-visible:ring-on-rail focus-visible:ring-offset-rail aria-expanded:bg-white/10 aria-expanded:text-on-rail sm:size-10 [&_svg:not([class*=size-])]:size-5';

/**
 * A link on the rail: its icon, named in a tooltip; the current one filled in violet (2.71:1 on the
 * rail, so a light ring carries the 3:1) with the orbit's satellite at its upper right.
 * @param props Component props.
 * @param props.label Its name.
 * @param props.href Where it goes.
 * @param props.current Whether it is the current page's.
 * @param props.children Its icon.
 * @returns The link.
 */
export const RailLink = (props: {
  label: string;
  href: string;
  current: boolean;
  children: React.ReactNode;
}) => (
  <ShellTip label={props.label}>
    <Link
      href={props.href}
      aria-label={props.label}
      aria-current={props.current ? 'page' : undefined}
      className={cn(
        'relative grid place-items-center outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2',
        RAIL_BUTTON,
        props.current && 'bg-violet text-white ring-1 ring-on-rail/50 ring-inset hover:bg-violet',
      )}
    >
      {props.children}
      {props.current && <Satellite className="top-1.5 right-1.5 text-on-rail" />}
    </Link>
  </ShellTip>
);

/**
 * The workspace's sections on the rail while the sidebar is folded into it (`strip`), so the shell
 * is one strip: the spaces, the insights and Settings, each its icon named in a tooltip, the
 * current section marked, then the toggle that expands the sidebar again (or ⌘\ / Ctrl+\). Not
 * drawn while the sidebar shows.
 * @param props Component props.
 * @param props.workspaceId The workspace the links stay in.
 * @returns The navigation.
 */
export const CrmStrip = (props: { workspaceId: number }) => {
  const t = useTranslations('CrmShell');
  const keys = useSidebarKeys();
  const base = `/app/${props.workspaceId}`;
  const section = sectionOf(usePathname(), base);
  const link = (entry: {
    key: Section;
    section: string;
    href: string;
    icon: React.ElementType;
  }) => (
    <RailLink
      key={entry.key}
      label={t(`nav_${entry.key}`)}
      href={`${base}${entry.href}`}
      current={section === entry.section}
    >
      <entry.icon className="size-5" />
    </RailLink>
  );
  const rule = <span aria-hidden="true" className="my-1 h-px w-6 shrink-0 bg-white/15" />;

  return (
    <nav
      aria-label={t('nav_label')}
      data-strip
      className="hidden min-h-0 w-full flex-1 [scrollbar-width:none] flex-col items-center gap-1.5 overflow-y-auto pt-1 strip:flex"
    >
      {rule}
      {SPACES.map((space) => link({ ...space, section: space.key, href: `/${space.key}` }))}
      {rule}
      {INSIGHTS.map(link)}
      <div className="mt-auto flex flex-col items-center gap-1.5 pt-1.5">
        {link(SETTINGS)}
        <ShellTip
          label={
            <>
              {t('expand_sidebar')}
              <kbd data-slot="kbd" className="font-sans opacity-75">
                {keys}
              </kbd>
            </>
          }
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('expand_sidebar')}
            aria-expanded={false}
            aria-controls="crm-sidebar"
            aria-keyshortcuts="Control+\ Meta+\"
            onClick={toggleSidebar}
            className={RAIL_BUTTON}
          >
            <ChevronsRightIcon />
          </Button>
        </ShellTip>
      </div>
    </nav>
  );
};
