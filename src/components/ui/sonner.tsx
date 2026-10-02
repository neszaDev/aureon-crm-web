'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react';
import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';

// Themed for Marksheet: toasts sit on the white ply with an ink-200 rule.
const TOASTER_STYLE: React.CSSProperties & Record<`--${string}`, string> = {
  '--normal-bg': 'var(--ply)',
  '--normal-text': 'var(--ink-900)',
  '--normal-border': 'var(--ink-200)',
  '--border-radius': 'var(--radius)',
};

// Marksheet has a single light theme, so the next-themes lookup is dropped.
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    style={TOASTER_STYLE}
    toastOptions={{
      classNames: {
        toast: 'cn-toast',
      },
    }}
    {...props}
  />
);

export { Toaster };
