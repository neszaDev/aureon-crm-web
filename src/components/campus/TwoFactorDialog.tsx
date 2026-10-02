'use client';

import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import type { TwoFactorResult } from '@/actions/TwoFactorActions';
import { sendTwoFactorCode, verifyTwoFactorCode } from '@/actions/TwoFactorActions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { TWO_FACTOR_CODE_LENGTH } from '@/validations/TwoFactorValidation';
import { MFU_LOGO } from './data';

/** A failed two-factor step, as the server actions return it. */
export type TwoFactorFailure = Extract<TwoFactorResult, { ok: false }>;

const SLOTS = Array.from({ length: TWO_FACTOR_CODE_LENGTH }, (_, index) => index);

/**
 * The two-factor code step (Vue `TwoFA`): six letters or digits, sent as soon as the last one
 * is typed, with a link to ask for a new code. Failures are handed to the error dialog.
 * @param props Component props.
 * @param props.open Whether the dialog is shown.
 * @param props.onOpenChange Called when the dialog asks to open or close.
 * @param props.email Address the code was sent to.
 * @param props.onPendingChange Called with `true` while a request runs, then `false`.
 * @param props.onFailure Called with the failed result of a request.
 * @returns The dialog.
 */
export const TwoFactorDialog = (props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onPendingChange: (pending: boolean) => void;
  onFailure: (failure: TwoFactorFailure) => void;
}) => {
  const t = useTranslations('CampusTwoFactor');
  const [code, setCode] = useState('');
  const [incomplete, setIncomplete] = useState(false);

  const run = async (request: () => Promise<TwoFactorResult>) => {
    props.onPendingChange(true);
    const result = await request();
    props.onPendingChange(false);
    setCode('');
    if (result.ok) {
      props.onOpenChange(false);
      return;
    }
    props.onFailure(result);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent closeLabel={t('close')} className="gap-6 rounded-lg p-6 sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <Image src={MFU_LOGO} alt="" width={48} height={80} className="h-20 w-auto" />
          <DialogTitle className="text-xl font-bold text-ink-950">{t('title')}</DialogTitle>
          <DialogDescription className="flex flex-col gap-1">
            <span>{t('priority')}</span>
            <span>{t('instructions')}</span>
            <span className="font-semibold break-all text-ink-900">
              {t('sent_to', { email: props.email })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.length < TWO_FACTOR_CODE_LENGTH) {
              setIncomplete(true);
              return;
            }
            void run(async () => await verifyTwoFactorCode({ code }));
          }}
        >
          <InputOTP
            maxLength={TWO_FACTOR_CODE_LENGTH}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            value={code}
            onChange={(value) => {
              setCode(value);
              setIncomplete(false);
            }}
            onComplete={async (value: string) => {
              await run(async () => await verifyTwoFactorCode({ code: value }));
            }}
            aria-label={t('code_label')}
            aria-describedby={incomplete ? 'two-factor-incomplete' : undefined}
            autoFocus
          >
            <InputOTPGroup className="gap-2">
              {SLOTS.map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="size-11 rounded-md border bg-ply text-lg font-bold text-ink-950 shadow-ply first:rounded-md last:rounded-md data-[active=true]:border-folder data-[active=true]:ring-folder/20 sm:size-12"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p
            id="two-factor-incomplete"
            role="alert"
            className="min-h-5 text-sm font-medium text-pen"
          >
            {incomplete && t('incomplete', { count: TWO_FACTOR_CODE_LENGTH })}
          </p>
        </form>

        <div className="flex flex-col items-center gap-1 text-center text-sm text-ink-600">
          <p>{t('delay')}</p>
          <p className="flex flex-wrap items-center justify-center gap-x-1.5">
            {t('not_received')}
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={async () => {
                await run(sendTwoFactorCode);
              }}
            >
              {t('resend')}
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
