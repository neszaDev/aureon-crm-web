'use client';

import { cn } from 'cn';
import { CircleCheckIcon, ClockIcon, InfoIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const SIZE_CLASS = {
  sm: 'sm:max-w-xs',
  default: 'sm:max-w-lg',
  lg: 'sm:max-w-3xl',
} as const;

const TONE = {
  plain: { band: '', icon: undefined, close: 'ghost' },
  folder: { band: 'bg-folder text-folder-ink', icon: undefined, close: 'inverse-ghost' },
  pass: { band: 'bg-pass/[0.08] text-pass', icon: CircleCheckIcon, close: 'ghost' },
  pencil: { band: 'bg-pencil/[0.08] text-pencil', icon: ClockIcon, close: 'ghost' },
  muted: { band: 'bg-ink-100 text-ink-900', icon: InfoIcon, close: 'ghost' },
  deep: { band: 'bg-folder-deep text-folder-ink', icon: undefined, close: 'inverse-ghost' },
} as const;

type Tone = keyof typeof TONE;

/**
 * One example modal: a trigger button and the dialog it opens, on the Marksheet paper.
 * @param props Component props.
 * @param props.trigger Label of the trigger button.
 * @param props.triggerVariant Variant of the trigger button.
 * @param props.title Dialog title.
 * @param props.description Line under the title (also the accessible description).
 * @param props.size Width: small, default or large.
 * @param props.tone Header band colour.
 * @param props.scrollable Keep the dialog within the viewport and scroll the body.
 * @param props.modalOnly Ignore clicks outside (Escape and the buttons still close it).
 * @param props.footer Footer buttons; the default is Cancel and Save.
 * @param props.children The body.
 * @returns The trigger and its dialog.
 */
const DemoModal = (props: {
  trigger: string;
  triggerVariant?: React.ComponentProps<typeof Button>['variant'];
  title: string;
  description?: string;
  size?: keyof typeof SIZE_CLASS;
  tone?: Tone;
  scrollable?: boolean;
  modalOnly?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const t = useTranslations('ModalsPage');
  const tone = TONE[props.tone ?? 'plain'];
  const Icon = tone.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={props.triggerVariant ?? 'outline'}>{props.trigger}</Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        // Without a description line, opt out of Radix's describedby link instead of leaving
        // it pointing at nothing.
        {...(props.description ? {} : { 'aria-describedby': undefined })}
        onInteractOutside={
          props.modalOnly
            ? (event) => {
                event.preventDefault();
              }
            : undefined
        }
        className={cn(
          'gap-0 rounded-lg bg-paper-card p-0 text-ink-900 shadow-paper ring-0',
          SIZE_CLASS[props.size ?? 'default'],
          props.scrollable && 'max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)_auto]',
        )}
      >
        <DialogHeader
          className={cn(
            'flex-row items-start gap-3 rounded-t-lg border-b-[3px] border-double border-ink-300 py-4 pr-3 pl-6',
            tone.band,
          )}
        >
          {Icon && <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <DialogTitle className="text-lg leading-snug font-semibold text-current">
              {props.title}
            </DialogTitle>
            {props.description && (
              <DialogDescription className="text-current opacity-85">
                {props.description}
              </DialogDescription>
            )}
          </div>
          <DialogClose asChild>
            <Button variant={tone.close} size="icon-sm" aria-label={t('close')}>
              <XIcon />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div
          className={cn(
            'flex flex-col gap-3 px-6 py-5 text-[0.9375rem]',
            props.scrollable && 'overflow-y-auto',
          )}
        >
          {props.children}
        </div>
        <DialogFooter className="mx-0 mb-0 rounded-b-lg border-ink-200 bg-ink-100/50 px-6 py-4">
          {props.footer ?? (
            <>
              <DialogClose asChild>
                <Button variant="outline">{t('cancel')}</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>{t('save')}</Button>
              </DialogClose>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * The modal examples of the Vue page: sizes, a scrolling body, contextual modals, a
 * destructive confirmation and a centred modal with its own header and footer.
 * @returns The launch buttons and their modals.
 */
export const ModalsDemo = () => {
  const t = useTranslations('ModalsPage');
  const body = <p>{t('body')}</p>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        <DemoModal trigger={t('launch_demo')} title={t('modal_title')}>
          {body}
        </DemoModal>
        <DemoModal trigger={t('launch_large')} title={t('modal_title')} size="lg">
          {body}
        </DemoModal>
        <DemoModal trigger={t('launch_small')} title={t('modal_title')} size="sm">
          {body}
        </DemoModal>
        <DemoModal trigger={t('launch_scrollable')} title={t('scrollable_title')} scrollable>
          {(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const).map((key) => (
            <p key={key}>{t(`long_${key}`)}</p>
          ))}
        </DemoModal>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <DemoModal
          trigger={t('launch_primary')}
          triggerVariant="default"
          title={t('modal_title')}
          tone="folder"
        >
          {body}
        </DemoModal>
        <DemoModal
          trigger={t('launch_success')}
          triggerVariant="secondary"
          title={t('success_title')}
          description={t('success_description')}
          tone="pass"
          footer={
            <DialogClose asChild>
              <Button>{t('done')}</Button>
            </DialogClose>
          }
        >
          {body}
        </DemoModal>
        <DemoModal
          trigger={t('launch_pending')}
          triggerVariant="secondary"
          title={t('pending_title')}
          description={t('pending_description')}
          tone="pencil"
        >
          {body}
        </DemoModal>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2Icon data-icon="inline-start" />
              {t('launch_destructive')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('destructive_title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('destructive_description')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('keep')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive">{t('delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <DemoModal
          trigger={t('launch_info')}
          triggerVariant="ghost"
          title={t('info_title')}
          tone="muted"
        >
          {body}
        </DemoModal>
        <DemoModal
          trigger={t('launch_custom')}
          triggerVariant="ghost"
          title={t('custom_title')}
          description={t('custom_description')}
          size="lg"
          tone="deep"
          modalOnly
          footer={
            <>
              <DialogClose asChild>
                <Button variant="outline">{t('discard')}</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>{t('accept')}</Button>
              </DialogClose>
            </>
          }
        >
          {body}
        </DemoModal>
      </div>
    </div>
  );
};
