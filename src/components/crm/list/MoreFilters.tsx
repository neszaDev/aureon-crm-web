'use client';

import { cn } from 'cn';
import { ChevronDownIcon, ListFilterIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TOOL_PART, toolClass } from '@/components/crm/list/FilterChip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * The rarely used filters behind one toolbar chip, so the toolbar holds one line: "More", with how
 * many of them are on, opens a popover that lists their chips, each still showing its value and
 * its ×. In the phone's "Filters" sheet they are listed with the others instead.
 * @param props Component props.
 * @param props.count How many of them are on.
 * @param props.children Their chips.
 * @returns The chip, and the chips for the sheet.
 */
export const MoreFilters = (props: { count: number; children: React.ReactNode }) => {
  const t = useTranslations('ListToolbar');
  const on = props.count > 0;

  return (
    <>
      <Popover>
        <PopoverTrigger
          aria-label={t('more_label', { count: props.count })}
          className={cn(toolClass(on), TOOL_PART, 'max-md:hidden')}
        >
          <ListFilterIcon aria-hidden="true" className="size-3.5 shrink-0 opacity-70" />
          {t('more')}
          {on ? (
            <span
              aria-hidden="true"
              className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-violet px-1 text-[0.6875rem] font-semibold text-white tabular-nums"
            >
              {props.count}
            </span>
          ) : (
            <ChevronDownIcon aria-hidden="true" className="size-3.5 shrink-0 opacity-70" />
          )}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="flex w-auto max-w-80 flex-col items-start gap-1.5 p-2"
        >
          {props.children}
        </PopoverContent>
      </Popover>
      <div className="contents md:hidden">{props.children}</div>
    </>
  );
};
