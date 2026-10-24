'use client';

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WorkspaceMark } from '@/components/crm/WorkspaceMark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { components } from '@/libs/api/schema';
import { Link } from '@/libs/I18nNavigation';

/**
 * The current workspace at the head of the sidebar (its avatar, name and a chevron); it opens a
 * menu of the user's other workspaces and a way to create one.
 * @param props Component props.
 * @param props.current The open workspace.
 * @param props.current.id Its id.
 * @param props.current.name Its name.
 * @param props.workspaces Every workspace the user belongs to.
 * @returns The switcher.
 */
export const WorkspaceSwitcher = (props: {
  current: { id: number; name: string };
  workspaces: components['schemas']['WorkspaceSummaryResponse'][];
}) => {
  const t = useTranslations('CrmShell');
  const tRole = useTranslations('Roles');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('switcher_label', { name: props.current.name })}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-md px-2 text-left text-foreground transition-colors duration-150 hover:bg-ink/6 aria-expanded:bg-ink/6"
      >
        <WorkspaceMark name={props.current.name} className="size-6 text-[0.6875rem]" />
        <span title={props.current.name} className="min-w-0 flex-1 truncate text-sm font-semibold">
          {props.current.name}
        </span>
        <ChevronsUpDownIcon aria-hidden="true" className="size-4 shrink-0 text-ink-2" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>{t('workspaces')}</DropdownMenuLabel>
        {props.workspaces.map((workspace) => {
          const current = workspace.id === props.current.id;
          const { name } = workspace;

          return (
            <DropdownMenuItem key={workspace.id} asChild className="gap-2.5 py-2">
              <Link href={`/app/${workspace.id}`} aria-current={current ? 'page' : undefined}>
                <WorkspaceMark name={name} className="size-6 text-[0.6875rem]" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground">
                    {tRole(`role_${workspace.role}`)}
                  </span>
                </span>
                {current && (
                  <>
                    <CheckIcon aria-hidden="true" className="text-violet-ink" />
                    <span className="sr-only">{t('current')}</span>
                  </>
                )}
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/new">
            <PlusIcon aria-hidden="true" />
            {t('create_workspace')}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
