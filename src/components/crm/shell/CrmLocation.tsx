'use client';

import { useTranslations } from 'next-intl';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { recordNumber } from '@/libs/crm/Format';
import { Link, usePathname } from '@/libs/I18nNavigation';

const SECTIONS = [
  'companies',
  'contacts',
  'leads',
  'deals',
  'tasks',
  'dashboard',
  'reports',
  'settings',
] as const;
const KINDS = {
  companies: 'company',
  contacts: 'contact',
  leads: 'lead',
  deals: 'deal',
  tasks: 'task',
} as const;
const SETTINGS = [
  'workspace',
  'members',
  'roles',
  'pipeline',
  'sources',
  'audit',
  'profile',
] as const;

const isSection = (value: string) => SECTIONS.find((section) => section === value);
const kindOf = (section: string) => Object.entries(KINDS).find(([key]) => key === section)?.[1];
const isSettingsPage = (value: string) => SETTINGS.find((page) => page === value);

/**
 * Where you are, from the URL alone (no read of its own): the workspace, the section, and the
 * record by its number, a new one, or a settings page. The last is the current page; the
 * others link back up. A long name is cut short, whole in its tooltip.
 * @param props Component props.
 * @param props.workspace The open workspace.
 * @param props.workspace.id Its id.
 * @param props.workspace.name Its name.
 * @returns The trail.
 */
export const CrmLocation = (props: { workspace: { id: number; name: string } }) => {
  const t = useTranslations('CrmShell');
  const tSettings = useTranslations('SettingsNav');
  const base = `/app/${props.workspace.id}`;
  const pathname = usePathname();
  const [section = '', page = ''] = pathname.slice(base.length).split('/').slice(1);
  const crumbs = [{ label: props.workspace.name, href: base }];
  const known = isSection(section);
  if (known) {
    const sectionHref = known === 'settings' ? `${base}/settings/workspace` : `${base}/${known}`;
    crumbs.push({ label: t(`nav_${known}`), href: sectionHref });
    const settingsPage = known === 'settings' ? isSettingsPage(page) : undefined;
    const kind = kindOf(known);
    if (settingsPage) {
      crumbs.push({
        label: tSettings(`nav_${settingsPage}`),
        href: `${base}/settings/${settingsPage}`,
      });
    } else if (kind && page === 'new') {
      crumbs.push({ label: t('location_new'), href: `${base}/${known}/new` });
    } else if (kind && /^\d+$/u.test(page)) {
      crumbs.push({ label: recordNumber(kind, Number(page)), href: `${base}/${known}/${page}` });
    }
  }

  return (
    <Breadcrumb aria-label={t('location_label')} className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap gap-1 text-[0.8125rem]">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;

          return (
            // The settings section and its first page share a link, not a name.
            <Fragment key={`${crumb.href} ${crumb.label}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className="min-w-0">
                {last && crumb.href === pathname ? (
                  <BreadcrumbPage title={crumb.label} className="truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="truncate no-underline">
                    <Link href={crumb.href} title={crumb.label}>
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
