'use client';

import { cn } from 'cn';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TOOL_PART, toolClass } from '@/components/crm/list/FilterChip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref, naturalDirection } from '@/libs/crm/ListQuery';
import { useRouter } from '@/libs/I18nNavigation';

/**
 * The toolbar's sort: a menu of the list's sorts and the two directions. A new sort takes its own
 * direction (names A to Z, dates newest first), as the column heads do. Keeps the other params and
 * goes back to the first page.
 * @param props Component props.
 * @param props.options Each sort and its label, the default one first.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The menu button.
 */
export const SortMenu = (props: {
  options: { sort: string; label: string }[];
  path: string;
  query: ListQuery;
}) => {
  const t = useTranslations('ListToolbar');
  const router = useRouter();
  const [first] = props.options;
  const natural = naturalDirection(props.query.sort);
  const direction = props.query.direction ?? natural;
  const label = props.options.find((option) => option.sort === props.query.sort)?.label;
  const go = (changes: Record<string, string | undefined>) => {
    router.push(listHref(props.path, props.query, changes), { scroll: false });
  };
  const Arrow = direction === 'ASC' ? ArrowUpIcon : ArrowDownIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(toolClass(false), TOOL_PART)}>
        <Arrow aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="sr-only">{t('sort_by')}</span> <span className="truncate">{label}</span>{' '}
        <span className="sr-only">{t(direction === 'ASC' ? 'ascending' : 'descending')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuLabel>{t('sort_by')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={props.query.sort}
          onValueChange={(next) => {
            go({ sort: next === first?.sort ? undefined : next, direction: undefined });
          }}
        >
          {props.options.map((option) => (
            <DropdownMenuRadioItem key={option.sort} value={option.sort}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={direction}
          onValueChange={(next) => {
            go({ direction: next === natural ? undefined : next });
          }}
        >
          <DropdownMenuRadioItem value="ASC">
            <ArrowUpIcon aria-hidden="true" />
            {t('ascending')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="DESC">
            <ArrowDownIcon aria-hidden="true" />
            {t('descending')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
