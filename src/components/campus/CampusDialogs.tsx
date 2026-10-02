'use client';

import {
  BanIcon,
  CircleHelpIcon,
  LoaderCircleIcon,
  MessageSquareWarningIcon,
  RotateCcwIcon,
  SendIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from './LoadingOverlay';
import type { DialogMessageButton, DialogMessageContent } from './MessageDialog';
import { MessageDialog } from './MessageDialog';
import { SignInHelpDialog } from './SignInHelpDialog';
import { TwoFactorDialog } from './TwoFactorDialog';

const LOADING_DEMO_MS = 2000;

type Message = { content: DialogMessageContent; buttons: DialogMessageButton[] };

/**
 * The campus dialogs, each opened by a button: sign-in help, the two-factor step, an error
 * message and the loading overlay. The two-factor step reports its failures through the same
 * error dialog and overlay, as the Vue app did through its store.
 * @param props Component props.
 * @param props.email Address the two-factor code is sent to.
 * @returns The buttons and the dialogs.
 */
export const CampusDialogs = (props: { email: string }) => {
  const t = useTranslations('CampusDialogs');
  const [help, setHelp] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>();
  const [messageOpen, setMessageOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string>();

  const showMessage = (next: Message) => {
    setMessage(next);
    setMessageOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setHelp(true);
          }}
        >
          <CircleHelpIcon data-icon="inline-start" />
          {t('open_help')}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setTwoFactor(true);
          }}
        >
          <ShieldCheckIcon data-icon="inline-start" />
          {t('open_two_factor')}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            showMessage({
              content: {
                title: t('error_title'),
                message: t('sample_error'),
                number: '1',
                code: '40100',
              },
              buttons: [
                { code: 'cancel', label: t('cancel'), icon: BanIcon },
                { code: 'submit', label: t('submit'), icon: SendIcon, variant: 'default' },
              ],
            });
          }}
        >
          <MessageSquareWarningIcon data-icon="inline-start" />
          {t('open_error')}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
            }, LOADING_DEMO_MS);
          }}
        >
          <LoaderCircleIcon data-icon="inline-start" />
          {t('open_loading')}
        </Button>
      </div>
      <output aria-live="polite" className="min-h-5 text-sm text-ink-600">
        {lastAction && t('last_action', { code: lastAction })}
      </output>

      <SignInHelpDialog open={help} onOpenChange={setHelp} />
      <TwoFactorDialog
        open={twoFactor}
        onOpenChange={setTwoFactor}
        email={props.email}
        onPendingChange={setLoading}
        onFailure={(failure) => {
          showMessage({
            content: {
              title: t('error_title'),
              message: failure.message,
              number: '1',
              code: failure.code,
            },
            buttons: [
              { code: 'cancel', label: t('cancel'), icon: BanIcon },
              { code: 'retry', label: t('retry'), icon: RotateCcwIcon, variant: 'default' },
            ],
          });
        }}
      />
      {message && (
        <MessageDialog
          open={messageOpen}
          onOpenChange={setMessageOpen}
          content={message.content}
          buttons={message.buttons}
          onAction={(code) => {
            setLastAction(code);
            if (code === 'cancel') {
              setTwoFactor(false);
            }
          }}
        />
      )}
      <LoadingOverlay open={loading} />
    </div>
  );
};
