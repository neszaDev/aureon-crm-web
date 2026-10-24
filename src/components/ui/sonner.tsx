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

// Themed for Aureon: toasts are popovers, so they follow the light and dark tokens.
const TOASTER_STYLE: React.CSSProperties & Record<`--${string}`, string> = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
  '--border-radius': 'var(--radius)',
};

// The theme comes from the CSS tokens (cookie class or OS), not next-themes; the description
// colour is the one part sonner hard-codes per theme, so it is overridden.
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
        description: 'text-muted-foreground!',
      },
    }}
    {...props}
  />
);

export { Toaster };
