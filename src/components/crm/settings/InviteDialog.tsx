'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon, CopyIcon, EyeOffIcon, LoaderCircleIcon, UserPlusIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { CreatedInvitation } from '@/actions/crm/InvitationActions';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { describedBy, FormField } from '@/components/FormField';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { ActionResult } from '@/libs/api/ApiError';
import { focusOnMount } from '@/utils/Focus';
import type { InvitationValues } from '@/validations/crm/InvitationValidation';
import { InvitationValidation } from '@/validations/crm/InvitationValidation';
import type { WorkspaceRole } from '@/validations/crm/MemberValidation';

type InviteAction = (
  values: InvitationValues,
) => Promise<ActionResult & { invitation?: CreatedInvitation }>;

const isFormField = (field: string): field is keyof InvitationValues =>
  field in InvitationValidation.shape;

/**
 * Email and role of the person to invite.
 * @param props Component props.
 * @param props.roles The roles the caller may give.
 * @param props.action Creates the invitation.
 * @param props.onCreated Receives the new invitation and its link.
 * @returns The form.
 */
const InviteForm = (props: {
  roles: readonly WorkspaceRole[];
  action: InviteAction;
  onCreated: (invitation: CreatedInvitation) => void;
}) => {
  const t = useTranslations('InviteDialog');
  const tRole = useTranslations('Roles');
  const [failure, setFailure] = useState<ActionResult>();
  const form = useForm<InvitationValues>({
    resolver: zodResolver(InvitationValidation),
    defaultValues: { email: '', role: 'SALES_REP' },
  });
  const role = useWatch({ control: form.control, name: 'role' });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    const result = await props.action(values);
    if (result.invitation) {
      props.onCreated(result.invitation);
      return;
    }

    for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
      if (isFormField(name)) {
        form.setError(name, { type: 'server', message });
      }
    }
    setFailure(result);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>{t('description')}</DialogDescription>
      </DialogHeader>
      <ActionAlert result={failure} />
      <FormField htmlFor="invite-email" label={t('email_label')} error={errors.email}>
        <Input
          id="invite-email"
          type="email"
          autoComplete="off"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy('invite-email')}
          {...form.register('email')}
        />
      </FormField>
      <FormField
        htmlFor="invite-role"
        label={t('role_label')}
        hint={t(`role_hint_${role}`)}
        error={errors.role}
      >
        <NativeSelect
          id="invite-role"
          aria-invalid={errors.role ? true : undefined}
          aria-describedby={describedBy('invite-role')}
          {...form.register('role')}
        >
          {props.roles.map((item) => (
            <NativeSelectOption key={item} value={item}>
              {tRole(`role_${item}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * The new invitation's link, shown this once: the server keeps only its hash.
 * @param props Component props.
 * @param props.invitation The invitation.
 * @param props.timeZone The workspace's time zone, for the expiry.
 * @returns The link with its copy button and expiry.
 */
const InvitationLink = (props: { invitation: CreatedInvitation; timeZone: string }) => {
  const t = useTranslations('InviteDialog');
  const tRole = useTranslations('Roles');
  const format = useFormatter();
  const [copied, setCopied] = useState<boolean>();

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t('created_title')}</DialogTitle>
        <DialogDescription>
          {t('created_text', {
            email: props.invitation.email,
            role: tRole(`role_${props.invitation.role}`),
          })}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-link">{t('link_label')}</Label>
        <div className="flex gap-2">
          <Input
            id="invite-link"
            readOnly
            value={props.invitation.link}
            className="font-mono text-[0.8125rem] sm:text-[0.8125rem]"
            onFocus={(event) => {
              event.currentTarget.select();
            }}
          />
          <Button
            // The form's submit button is gone: focus moves here.
            ref={focusOnMount}
            type="button"
            variant="outline"
            onClick={async () => {
              setCopied(
                await navigator.clipboard.writeText(props.invitation.link).then(
                  () => true,
                  () => false,
                ),
              );
            }}
          >
            {copied ? (
              <CheckIcon data-icon="inline-start" />
            ) : (
              <CopyIcon data-icon="inline-start" />
            )}
            {t('copy')}
          </Button>
        </div>
        <output className={copied === false ? 'text-sm text-danger' : 'text-sm text-success'}>
          {copied === true && t('copied')}
          {copied === false && t('copy_failed')}
        </output>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('expires', {
          date: format.dateTime(new Date(props.invitation.expiresAt), {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: props.timeZone,
          }),
          zone: props.timeZone.replaceAll('_', ' '),
        })}
      </p>
      <p className="flex items-start gap-2.5 rounded-md border border-rule bg-muted px-3.5 py-3 text-sm font-medium">
        <EyeOffIcon aria-hidden="true" className="mt-px size-4 shrink-0 text-muted-foreground" />
        {t('shown_once')}
      </p>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button">{t('done')}</Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
};

/**
 * "Invite member": a dialog that creates an invitation, then shows its link once, with a copy
 * button and when it expires. Opening the dialog again starts a new invitation; the link is gone.
 * @param props Component props.
 * @param props.action Creates the invitation (`createInvitation` bound to the workspace).
 * @param props.roles The roles the caller may give (an admin can't invite owners).
 * @param props.timeZone The workspace's time zone, for the expiry.
 * @returns The button and its dialog.
 */
export const InviteDialog = (props: {
  action: InviteAction;
  roles: readonly WorkspaceRole[];
  timeZone: string;
}) => {
  const t = useTranslations('InviteDialog');
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<CreatedInvitation>();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setCreated(undefined);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon data-icon="inline-start" />
          {t('open')}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={t('close')}
        className="sm:max-w-md"
        // The link is shown only once: a stray Escape or click outside must not lose it. Done
        // and the close button still close.
        onEscapeKeyDown={(event) => {
          if (created) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (created) {
            event.preventDefault();
          }
        }}
      >
        {created ? (
          <InvitationLink invitation={created} timeZone={props.timeZone} />
        ) : (
          <InviteForm roles={props.roles} action={props.action} onCreated={setCreated} />
        )}
      </DialogContent>
    </Dialog>
  );
};
