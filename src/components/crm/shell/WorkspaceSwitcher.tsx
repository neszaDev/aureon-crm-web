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
 * The current workspace at the head of the rail; it opens a menu of the user's other workspaces
 * and a way to create one.
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
        className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-on-seal transition-colors duration-150 hover:bg-black/10 focus-visible:outline-on-seal data-[state=open]:bg-black/10"
      >
        <WorkspaceMark name={props.current.name} tone="rail" />
        <span className="line-clamp-2 min-w-0 flex-1 text-[0.9375rem] leading-snug font-bold break-words">
          {props.current.name}
        </span>
        <ChevronsUpDownIcon aria-hidden="true" className="size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>{t('workspaces')}</DropdownMenuLabel>
        {props.workspaces.map((workspace) => {
          const current = workspace.id === props.current.id;
          const name = workspace.name ?? '';

          return (
            <DropdownMenuItem key={workspace.id} asChild className="gap-2.5 py-2">
              <Link href={`/app/${workspace.id}`} aria-current={current ? 'page' : undefined}>
                <WorkspaceMark name={name} className="size-6 border-[1.5px] text-[0.625rem]" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{name}</span>
                  {workspace.role && (
                    <span className="text-xs text-muted-foreground">
                      {tRole(`role_${workspace.role}`)}
                    </span>
                  )}
                </span>
                {current && (
                  <>
                    <CheckIcon aria-hidden="true" className="text-seal-ink" />
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
