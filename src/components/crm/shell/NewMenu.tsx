'use client';

import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SPACES, SpaceChip } from '@/components/crm/shell/CrmNav';
import { ShellTip } from '@/components/crm/shell/ShellTip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@/libs/I18nNavigation';

/**
 * The rail's "+ New": a menu of what to create, each on its space's colour. Every member may
 * create all five (the API's permission matrix), so none is hidden. A company, contact, lead or
 * deal opens its form page; a task, which has no page of its own, opens the task list, whose
 * "New task" asks for it.
 * @param props Component props.
 * @param props.workspaceId The workspace the records go in.
 * @param props.className Extra classes for the trigger (its colours on the rail).
 * @returns The button and its menu.
 */
export const NewMenu = (props: { workspaceId: number; className?: string }) => {
  const t = useTranslations('CrmShell');
  const base = `/app/${props.workspaceId}`;

  return (
    <DropdownMenu>
      <ShellTip label={t('new_label')}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" aria-label={t('new_label')} className={props.className}>
            <PlusIcon />
          </Button>
        </DropdownMenuTrigger>
      </ShellTip>
      <DropdownMenuContent side="right" align="start" sideOffset={10} className="w-52">
        <DropdownMenuLabel>{t('new_menu')}</DropdownMenuLabel>
        {SPACES.map((space) => (
          <DropdownMenuItem key={space.key} asChild>
            <Link href={space.key === 'tasks' ? `${base}/tasks` : `${base}/${space.key}/new`}>
              <SpaceChip space={space} />
              {t(`new_${space.key}`)}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
