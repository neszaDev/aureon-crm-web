'use client';

import { cn } from 'cn';
import { BellRingIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Toaster } from '@/components/ui/sonner';
import { Textarea } from '@/components/ui/textarea';
import type { DesktopNotificationResult } from './desktopNotification';
import { sendDesktopNotification } from './desktopNotification';

const TOAST_POSITIONS = [
  'static',
  'top-left',
  'top-center',
  'top-right',
  'top-full',
  'bottom-left',
  'bottom-center',
  'bottom-right',
  'bottom-full',
] as const;

type ToastPosition = (typeof TOAST_POSITIONS)[number];

type StaticToastProps = {
  id: number;
  title: string;
  body: string;
  closeButton: boolean;
  fade: boolean;
  autohide: number | null;
};

const FULL_WIDTH_TOASTER = 'full-width';

/** Where sonner puts each floating position; the "full" ones go to the full-width toaster. */
const FLOATING = {
  'top-left': { position: 'top-left', full: false },
  'top-center': { position: 'top-center', full: false },
  'top-right': { position: 'top-right', full: false },
  'top-full': { position: 'top-center', full: true },
  'bottom-left': { position: 'bottom-left', full: false },
  'bottom-center': { position: 'bottom-center', full: false },
  'bottom-right': { position: 'bottom-right', full: false },
  'bottom-full': { position: 'bottom-center', full: true },
} as const;

/**
 * A toast drawn in place, for the "static" position.
 * @param props Component props.
 * @param props.toast The toast to show.
 * @param props.onClose Called when it is closed or its time is up.
 * @returns The toast.
 */
const StaticToast = (props: { toast: StaticToastProps; onClose: () => void }) => {
  const t = useTranslations('ToasterPage');
  const { autohide } = props.toast;
  const expire = useEffectEvent(() => {
    props.onClose();
  });

  // The autohide timer is an external clock, started once per toast.
  useEffect(() => {
    const timer = autohide === null ? undefined : window.setTimeout(expire, autohide);
    return () => {
      window.clearTimeout(timer);
    };
  }, [autohide]);

  return (
    <li
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'w-full max-w-sm rounded-md border border-ink-200 bg-ply shadow-ply',
        props.toast.fade && 'animate-in duration-300 fade-in-0',
      )}
    >
      <div className="flex items-center gap-2 border-b border-ink-200 py-1.5 pr-1.5 pl-3">
        <p className="flex-1 text-sm font-semibold text-ink-950">{props.toast.title}</p>
        {props.toast.closeButton && (
          <Button variant="ghost" size="icon-xs" aria-label={t('close')} onClick={props.onClose}>
            <XIcon />
          </Button>
        )}
      </div>
      <p className="px-3 py-2.5 text-sm text-ink-700">{props.toast.body}</p>
    </li>
  );
};

/**
 * The Vue toaster demo on sonner: pick autohide, position, fade, close button and the text,
 * then add toasts. "Static" toasts are drawn in the preview column; the others use sonner,
 * with a second, full-width toaster for the "full" positions. Also sends a desktop
 * notification through the browser's Notification API.
 * @returns The form, the preview and the toasters.
 */
export const ToasterDemo = () => {
  const t = useTranslations('ToasterPage');
  const id = useId();
  const [autohide, setAutohide] = useState(true);
  const [autohideMs, setAutohideMs] = useState('5000');
  const [position, setPosition] = useState<ToastPosition>('top-right');
  const [fade, setFade] = useState(true);
  const [closeButton, setCloseButton] = useState(true);
  const [title, setTitle] = useState(() => t('default_title'));
  const [body, setBody] = useState('');
  const [counts, setCounts] = useState<Partial<Record<ToastPosition, number>>>({ static: 2 });
  const [staticToasts, setStaticToasts] = useState<StaticToastProps[]>(() =>
    [1, 2].map((number) => ({
      id: number,
      title: t('default_title'),
      body: t('generated_body', { position: t('position_static'), number }),
      closeButton: true,
      fade: true,
      autohide: null,
    })),
  );
  const [desktop, setDesktop] = useState<DesktopNotificationResult | 'pending'>();

  const addToast = () => {
    const number = (counts[position] ?? 0) + 1;
    setCounts({ ...counts, [position]: number });
    const duration = Number(autohideMs);
    const text = {
      title: title.trim() || t('default_title'),
      body: body.trim() || t('generated_body', { position: t(`position_${position}`), number }),
    };

    if (position === 'static') {
      setStaticToasts([
        ...staticToasts,
        {
          id: Date.now(),
          ...text,
          closeButton,
          fade,
          autohide: autohide && duration > 0 ? duration : null,
        },
      ]);
      return;
    }

    const floating = FLOATING[position];
    toast(text.title, {
      description: text.body,
      position: floating.position,
      toasterId: floating.full ? FULL_WIDTH_TOASTER : undefined,
      duration: autohide && duration > 0 ? duration : Number.POSITIVE_INFINITY,
      closeButton,
      // Sonner always animates; "no fade" drops its transitions for this toast.
      style: fade ? undefined : { transition: 'none' },
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        className="flex flex-col gap-5"
        aria-labelledby={`${id}-heading`}
        onSubmit={(event) => {
          event.preventDefault();
          addToast();
        }}
      >
        <h3 id={`${id}-heading`} className="text-base font-semibold text-ink-950">
          {t('form_title')}
        </h3>

        <div className="flex items-center gap-2.5">
          <Checkbox
            id={`${id}-autohide`}
            checked={autohide}
            onCheckedChange={(checked) => {
              setAutohide(checked === true);
            }}
          />
          <Label htmlFor={`${id}-autohide`}>{t('autohide')}</Label>
        </div>
        {autohide && (
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-ms`}>{t('autohide_ms')}</Label>
            <Input
              id={`${id}-ms`}
              type="number"
              inputMode="numeric"
              min={500}
              step={500}
              value={autohideMs}
              onChange={(event) => {
                setAutohideMs(event.target.value);
              }}
              className="max-w-40 tabular-nums"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-position`}>{t('position')}</Label>
          <NativeSelect
            id={`${id}-position`}
            value={position}
            onChange={(event) => {
              const next = TOAST_POSITIONS.find((value) => value === event.target.value);
              if (next) {
                setPosition(next);
              }
            }}
            className="max-w-64"
          >
            {TOAST_POSITIONS.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {t(`position_${value}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="flex items-center gap-2.5">
          <Checkbox
            id={`${id}-fade`}
            checked={fade}
            onCheckedChange={(checked) => {
              setFade(checked === true);
            }}
          />
          <Label htmlFor={`${id}-fade`}>{t('fade')}</Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox
            id={`${id}-close`}
            checked={closeButton}
            onCheckedChange={(checked) => {
              setCloseButton(checked === true);
            }}
          />
          <Label htmlFor={`${id}-close`}>{t('close_button')}</Label>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-title`}>{t('toast_title')}</Label>
          <Input
            id={`${id}-title`}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-body`}>{t('toast_body')}</Label>
          <Textarea
            id={`${id}-body`}
            rows={2}
            value={body}
            placeholder={t('toast_body_placeholder')}
            onChange={(event) => {
              setBody(event.target.value);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-ink-200 pt-5">
          <Button type="submit">{t('add_toast')}</Button>
          <Button
            type="button"
            variant="outline"
            disabled={desktop === 'pending'}
            onClick={async () => {
              setDesktop('pending');
              setDesktop(
                await sendDesktopNotification(
                  'Notification' in window ? window.Notification : undefined,
                  {
                    title: title.trim() || t('default_title'),
                    body: body.trim() || t('desktop_body'),
                  },
                ),
              );
            }}
          >
            <BellRingIcon data-icon="inline-start" />
            {t('desktop')}
          </Button>
        </div>
        <output className="block min-h-5 text-[0.8125rem] text-ink-600">
          {desktop && desktop !== 'pending' && t(`desktop_${desktop}`)}
        </output>
      </form>

      <section aria-labelledby={`${id}-static`} className="flex flex-col gap-3">
        <h3 id={`${id}-static`} className="text-base font-semibold text-ink-950">
          {t('static_title')}
        </h3>
        {staticToasts.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {staticToasts.map((item) => (
              <StaticToast
                key={item.id}
                toast={item}
                onClose={() => {
                  setStaticToasts((current) => current.filter((other) => other.id !== item.id));
                }}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-600">{t('static_empty')}</p>
        )}
      </section>

      <Toaster />
      <Toaster id={FULL_WIDTH_TOASTER} className="[--width:calc(100vw-3rem)]!" />
    </div>
  );
};
