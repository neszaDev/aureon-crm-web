'use client';

import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * The table under a chart: the chart is hidden from assistive technology, so this is its text
 * version. It is open at every width, so the figures that are only in it (money, a month without
 * deals) are on the page and in find-in-page; the button, named "Table" whatever the state, with
 * `aria-expanded` for it, hides it for a reader who wants the chart alone.
 * @param props Component props.
 * @param props.children The table.
 * @returns The button and the table.
 */
export const ChartTable = (props: { children: React.ReactNode }) => {
  const t = useTranslations('ChartTable');
  const id = useId();
  const [open, setOpen] = useState(true);

  return (
    <div className="border-t border-rule">
      <div className="px-4 py-2 sm:px-5">
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={open}
          aria-controls={id}
          // Open is how it rests, not a selection: no fill, except under the pointer.
          className="-ml-2.5 aria-expanded:bg-transparent aria-expanded:hover:bg-accent"
          onClick={() => {
            setOpen(!open);
          }}
        >
          <ChevronDownIcon aria-hidden="true" className={cn(open && 'rotate-180')} />
          {t('label')}
        </Button>
      </div>
      <div id={id} hidden={!open}>
        {props.children}
      </div>
    </div>
  );
};
