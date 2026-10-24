'use client';

import { cn } from 'cn';
import { Rows3Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TOOL_PART, toolClass } from '@/components/crm/list/FilterChip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import { useRouter } from '@/libs/I18nNavigation';

// The list without groups; the URL leaves it out.
const NONE = 'none';

/**
 * The toolbar's grouping: None, or one of what the list can be grouped by (`group`). Keeps the
 * other params; grouped, the chip is on and names the grouping. The URL leaves the list's own
 * grouping out, so None is `group=none` on a list grouped by default.
 * @param props Component props.
 * @param props.options Each grouping and its label.
 * @param props.defaultGroup The list's own grouping, if it has one.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The menu button.
 */
export const GroupMenu = (props: {
  options: { group: string; label: string }[];
  defaultGroup?: string;
  path: string;
  query: ListQuery;
}) => {
  const t = useTranslations('ListToolbar');
  const router = useRouter();
  const current = props.options.find((option) => option.group === props.query.group);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(toolClass(current !== undefined), TOOL_PART)}>
        <Rows3Icon aria-hidden="true" className="size-3.5 shrink-0 opacity-70" />
        <span className="truncate">
          {current ? t('group_on', { label: current.label }) : t('group')}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-40">
        <DropdownMenuLabel>{t('group_by')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={current?.group ?? NONE}
          onValueChange={(next) => {
            const unwritten = next === (props.defaultGroup ?? NONE);
            router.push(
              listHref(props.path, props.query, { group: unwritten ? undefined : next }),
              {
                scroll: false,
              },
            );
          }}
        >
          <DropdownMenuRadioItem value={NONE}>{t('group_none')}</DropdownMenuRadioItem>
          {props.options.map((option) => (
            <DropdownMenuRadioItem key={option.group} value={option.group}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
