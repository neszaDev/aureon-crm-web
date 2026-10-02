'use client';

import { ExternalLinkIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MFU_LOGO, signInHelp } from './data';

/**
 * A document link that opens in a new tab.
 * @param props Component props.
 * @param props.href Address of the document.
 * @param props.children Link text.
 * @returns The link.
 */
const DocLink = (props: { href: string; children: React.ReactNode }) => {
  const t = useTranslations('CampusSignInHelp');

  return (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-folder underline-offset-4 hover:underline"
    >
      {props.children}
      <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
      <span className="sr-only">{t('new_tab')}</span>
    </a>
  );
};

/**
 * The sign-in help dialog (Vue `SignIn`): who to contact, the competency dictionary and user
 * manual in Thai and English, and the form to report a sign-in problem. Google sign-in is left
 * out: the Spring API has no Google login.
 * @param props Component props.
 * @param props.open Whether the dialog is shown.
 * @param props.onOpenChange Called when the dialog asks to open or close.
 * @returns The dialog.
 */
export const SignInHelpDialog = (props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const t = useTranslations('CampusSignInHelp');

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        closeLabel={t('close')}
        className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto rounded-lg p-6 sm:max-w-lg"
      >
        <DialogHeader className="items-center text-center">
          <Image src={MFU_LOGO} alt="" width={57} height={96} className="h-24 w-auto" />
          <DialogTitle className="text-lg font-bold text-ink-950">{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <ol className="flex list-decimal flex-col gap-4 pl-5 text-sm text-ink-900 marker:font-bold">
          <li className="flex flex-col gap-1">
            <span className="font-bold">{t('contact_title')}</span>
            <span>{t('contact_text', { phone: signInHelp.phone })}</span>
            <a
              href={`mailto:${signInHelp.email}`}
              className="w-fit font-semibold text-folder underline-offset-4 hover:underline"
            >
              {signInHelp.email}
            </a>
          </li>
          <li className="flex flex-col gap-1">
            <span className="font-bold">{t('competency_title')}</span>
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <DocLink href={signInHelp.competencyThai}>{t('thai_version')}</DocLink>
              <DocLink href={signInHelp.competencyEnglish}>{t('english_version')}</DocLink>
            </span>
          </li>
          <li className="flex flex-col gap-1">
            <span className="font-bold">{t('manual_title')}</span>
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <DocLink href={signInHelp.manualThai}>{t('thai_version')}</DocLink>
              <DocLink href={signInHelp.manualEnglish}>{t('english_version')}</DocLink>
            </span>
          </li>
          <li className="flex flex-col gap-1">
            <span className="font-bold">{t('issue_title')}</span>
            <DocLink href={signInHelp.issueForm}>{t('issue_link')}</DocLink>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
};
