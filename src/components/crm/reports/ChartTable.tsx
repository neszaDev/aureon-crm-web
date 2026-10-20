'use client';

import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';

// Tailwind's `md`.
const WIDE = '(min-width: 48rem)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
};

/**
 * The table under a chart: the chart is hidden from assistive technology, so this is its text
 * version, behind a "Show table" button. It is open below `md`, where the bars are small, and
 * closed from `md` up, where they carry their own numbers, until the reader chooses; what they
 * chose stays when the window is resized. Before the page hydrates the closed state is CSS, so a
 * wide screen never flashes the table.
 * @param props Component props.
 * @param props.children The table.
 * @returns The button and the table.
 */
export const ChartTable = (props: { children: React.ReactNode }) => {
  const t = useTranslations('ChartTable');
  const id = useId();
  // The server and the first paint say narrow.
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
  // Until the reader chooses, the screen's width does.
  const [choice, setChoice] = useState<boolean>();
  const open = choice ?? !wide;

  return (
    <div className="border-t border-rule">
      <div className="px-4 py-2 sm:px-5">
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={open}
          aria-controls={id}
          className="-ml-2.5"
          onClick={() => {
            setChoice(!open);
          }}
        >
          <ChevronDownIcon aria-hidden="true" className={cn(open && 'rotate-180')} />
          {open ? t('hide') : t('show')}
        </Button>
      </div>
      <div id={id} hidden={!open} className={cn(choice === undefined && 'md:hidden')}>
        {props.children}
      </div>
    </div>
  );
};
