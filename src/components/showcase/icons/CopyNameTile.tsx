'use client';

import { CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const RESET_MS = 1500;

/**
 * One gallery tile: the icon over its name; pressing it copies the name to the clipboard.
 * @param props Component props.
 * @param props.name The icon name, shown and copied.
 * @param props.children The icon.
 * @returns The tile, as a list item.
 */
export const CopyNameTile = (props: { name: string; children: React.ReactNode }) => {
  const t = useTranslations('IconGallery');
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const show = (next: 'copied' | 'failed') => {
    setStatus(next);
    window.setTimeout(() => {
      setStatus('idle');
    }, RESET_MS);
  };

  return (
    <li className="relative">
      <button
        type="button"
        aria-label={t('copy_name', { name: props.name })}
        className="flex h-full w-full flex-col items-center gap-3 rounded-md px-2 py-4 text-ink-900 transition-colors duration-150 hover:bg-ink-100 focus-visible:bg-ink-100"
        onClick={async () => {
          // The Clipboard API is missing outside secure contexts and the browser can refuse it.
          try {
            await navigator.clipboard.writeText(props.name);
            show('copied');
          } catch {
            show('failed');
          }
        }}
      >
        {props.children}
        <span className="text-xs break-all text-ink-700">{props.name}</span>
      </button>
      <span
        aria-live="polite"
        className="pointer-events-none absolute top-1.5 right-1.5 flex items-center gap-1 text-[0.6875rem] font-semibold text-folder empty:hidden data-[status=failed]:text-pen"
        data-status={status}
      >
        {status === 'copied' && (
          <>
            <CheckIcon aria-hidden="true" className="size-3" />
            {t('copied')}
          </>
        )}
        {status === 'failed' && t('copy_failed')}
      </span>
    </li>
  );
};
