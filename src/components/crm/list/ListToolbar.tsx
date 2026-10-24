'use client';

import { SlidersHorizontalIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

/**
 * A list's toolbar on one line: the search, then its filter chips, grouping, sort, "Me" and the
 * archived switch (`children`), and the export at the end. Below 768 px the search stays and the
 * rest moves into a "Filters" sheet, its button counting the filters that are on.
 * @param props Component props.
 * @param props.label What the landmark searches, such as "Search companies".
 * @param props.search The search box.
 * @param props.filters How many filters are on.
 * @param props.children The chips, menus and toggles.
 * @param props.end What sits at the end: the export.
 * @returns The toolbar.
 */
export const ListToolbar = (props: {
  label: string;
  search: React.ReactNode;
  filters: number;
  children: React.ReactNode;
  end?: React.ReactNode;
}) => {
  const t = useTranslations('ListToolbar');

  return (
    <search aria-label={props.label} className="flex flex-wrap items-center gap-1.5">
      {props.search}
      {/* From 768 px the controls are the row's own, wrapping one by one when it is full; the
          phone's sheet mounts its own only while it is open. */}
      <div className="max-md:hidden md:contents">{props.children}</div>
      <div className="ml-auto flex items-center gap-2 max-md:hidden">{props.end}</div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="md:hidden">
            <SlidersHorizontalIcon data-icon="inline-start" />
            {t('filters')}
            {props.filters > 0 && (
              <>
                <span
                  aria-hidden="true"
                  className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-tint px-1 text-xs font-semibold text-violet-ink tabular-nums"
                >
                  {props.filters}
                </span>
                <span className="sr-only">{t('filters_on', { count: props.filters })}</span>
              </>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          closeLabel={t('close')}
          aria-describedby={undefined}
          className="max-h-[85dvh] overflow-y-auto rounded-t-xl p-4 pb-6"
        >
          <SheetTitle className="text-[0.9375rem] font-semibold">{t('filters')}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2">{props.children}</div>
          {props.end && <div className="flex flex-wrap gap-2">{props.end}</div>}
        </SheetContent>
      </Sheet>
    </search>
  );
};
