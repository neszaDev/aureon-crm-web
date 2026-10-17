'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftIcon,
  BanIcon,
  Link2OffIcon,
  LoaderCircleIcon,
  LogOutIcon,
  MailCheckIcon,
  TimerOffIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { Seal } from '@/components/crm/Seal';
import { WorkspaceMark } from '@/components/crm/WorkspaceMark';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import { Link } from '@/libs/I18nNavigation';
import type { InvitationRegisterValues } from '@/validations/crm/InvitationValidation';
import { InvitationRegisterValidation } from '@/validations/crm/InvitationValidation';

type Invitation = components['schemas']['InvitationPreviewResponse'];
type User = { email?: string; displayName?: string };

const CLOSED_ICONS = {
  ACCEPTED: MailCheckIcon,
  REVOKED: BanIcon,
  EXPIRED: TimerOffIcon,
  unknown: Link2OffIcon,
} satisfies Record<string, LucideIcon>;

const PANEL = 'flex flex-col gap-5 rounded-lg border border-rule bg-card p-6 shadow-sheet sm:p-7';

/**
 * The page heading: the workspace's chop (or an icon), the title and one line under it.
 * @param props Component props.
 * @param props.workspaceName The workspace, for its chop.
 * @param props.icon Shown instead of the chop.
 * @param props.title The `h1`.
 * @param props.children The line under it.
 * @returns The heading.
 */
const Heading = (props: {
  workspaceName?: string;
  icon?: LucideIcon;
  title: string;
  children: React.ReactNode;
}) => {
  const Icon = props.icon;

  return (
    <div className="flex flex-col gap-5">
      {Icon ? (
        <Icon aria-hidden="true" className="size-9 text-muted-foreground" strokeWidth={1.75} />
      ) : (
        <WorkspaceMark name={props.workspaceName ?? ''} className="size-12 text-base" />
      )}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-balance break-words">
          {props.title}
        </h1>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{props.children}</p>
      </div>
    </div>
  );
};

/**
 * A person as their seal, with a small label over their email.
 * @param props Component props.
 * @param props.label What this person is ("Signed in as").
 * @param props.email Their email.
 * @param props.name Their display name, if known.
 * @returns The row.
 */
const Person = (props: { label: string; email: string; name?: string }) => {
  const at = props.email.lastIndexOf('@');

  return (
    <div className="flex items-center gap-3.5">
      <Seal name={props.name} email={props.email} size="lg" />
      <div className="flex min-w-0 flex-col">
        <span className="text-[0.8125rem] text-muted-foreground">{props.label}</span>
        {/* A long address wraps before the @ rather than mid-word. */}
        <span className="font-medium wrap-anywhere">
          {props.email.slice(0, at)}
          <wbr />
          {props.email.slice(at)}
        </span>
      </div>
    </div>
  );
};

/**
 * An invitation that can't be used: accepted, revoked, expired or unknown.
 * @param props Component props.
 * @param props.invitation The invitation, unless the link is unknown.
 * @returns The message and a way out.
 */
const ClosedInvitation = (props: { invitation?: Invitation }) => {
  const t = useTranslations('InvitationCard');
  const status = props.invitation?.status;
  // A pending invitation lands here only when the preview is incomplete: treat it as unknown.
  const kind = status && status !== 'PENDING' ? status : 'unknown';
  const accepted = kind === 'ACCEPTED';

  return (
    <div className="flex flex-col gap-8">
      <Heading icon={CLOSED_ICONS[kind]} title={t(`closed_${kind}_title`)}>
        {t(`closed_${kind}_text`, { workspace: props.invitation?.workspaceName ?? '' })}
      </Heading>
      <Button asChild variant={accepted ? 'default' : 'outline'} className="self-start">
        <Link href={accepted ? '/app' : '/'}>
          {!accepted && <ArrowLeftIcon data-icon="inline-start" />}
          {accepted ? t('open_workspaces') : t('back_home')}
        </Link>
      </Button>
    </div>
  );
};

/**
 * Creates the invited person's account: the email is the invitation's, so it is only shown.
 * @param props Component props.
 * @param props.token The link's token.
 * @param props.email The invited email.
 * @param props.register Creates the account and joins (`registerThroughInvitation`).
 * @returns The form.
 */
const RegisterForm = (props: {
  token: string;
  email: string;
  register: (token: string, values: InvitationRegisterValues) => Promise<ActionResult>;
}) => {
  const t = useTranslations('InvitationCard');
  const [failure, setFailure] = useState<ActionResult>();
  const form = useForm<InvitationRegisterValues>({
    resolver: zodResolver(InvitationRegisterValidation),
    defaultValues: { displayName: '', password: '' },
  });
  const name = useWatch({ control: form.control, name: 'displayName' });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    // On success the action redirects, so a result means something went wrong.
    const result = await props.register(props.token, values);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      if (field === 'displayName' || field === 'password') {
        form.setError(field, { type: 'server', message });
      }
    }
    setFailure(result);
  });

  return (
    <form method="post" onSubmit={onSubmit} className={PANEL} noValidate>
      <ActionAlert result={failure} />
      {/* The invitation's email, not editable; the seal shows the initials as the name is typed. */}
      <Person label={t('email_label')} email={props.email} name={name.trim() || undefined} />
      {/* Lets a password manager save the new password under this email. */}
      <input type="email" autoComplete="username" value={props.email} readOnly hidden />
      <FormField
        htmlFor="display-name"
        label={t('name_label')}
        aside={t('optional')}
        hint={t('name_hint')}
        error={errors.displayName}
      >
        <Input
          id="display-name"
          autoComplete="name"
          aria-invalid={errors.displayName ? true : undefined}
          aria-describedby={describedBy('display-name')}
          {...form.register('displayName')}
        />
      </FormField>
      <FormField
        htmlFor="password"
        label={t('password_label')}
        hint={t('password_hint')}
        error={errors.password}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={describedBy('password')}
          {...form.register('password')}
        />
      </FormField>
      <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
        {t('register_button')}
      </Button>
    </form>
  );
};

/**
 * What an invitation link opens: the form to create an account (signed out), the button to
 * join (signed in with the invited email), why it can't be used with this account, or why the
 * link no longer works.
 * @param props Component props.
 * @param props.token The link's token, a secret: only passed back to the actions.
 * @param props.invitation The preview, or nothing for an unknown link.
 * @param props.user The signed-in user, if any.
 * @param props.accept Joins as the signed-in user (`acceptInvitation`).
 * @param props.register Creates the account and joins (`registerThroughInvitation`).
 * @param props.signOut Signs out, then goes to the given page (`signOut`).
 * @returns The page content.
 */
export const InvitationCard = (props: {
  token: string;
  invitation?: Invitation;
  user?: User;
  accept: (token: string) => Promise<ActionResult>;
  register: (token: string, values: InvitationRegisterValues) => Promise<ActionResult>;
  signOut: (next: string) => Promise<void>;
}) => {
  const t = useTranslations('InvitationCard');
  const tRole = useTranslations('Roles');
  const [failure, setFailure] = useState<ActionResult>();
  const [pending, startTransition] = useTransition();

  if (props.invitation?.status !== 'PENDING' || !props.invitation.email || !props.invitation.role) {
    return <ClosedInvitation invitation={props.invitation} />;
  }

  const workspace = props.invitation.workspaceName ?? '';
  const role = tRole(`role_${props.invitation.role}`);
  const userEmail = props.user?.email;

  if (!userEmail) {
    return (
      <div className="flex flex-col gap-8">
        <Heading workspaceName={workspace} title={t('join_title', { workspace })}>
          {t('register_text', { role })}
        </Heading>
        <RegisterForm
          token={props.token}
          email={props.invitation.email}
          register={props.register}
        />
        <p className="text-sm text-muted-foreground">
          {t('have_account')}{' '}
          <Link
            href={{ pathname: '/sign-in', query: { next: `/invite/${props.token}` } }}
            className="font-semibold text-seal-ink underline decoration-seal-ink/40 underline-offset-4 hover:decoration-seal-ink"
          >
            {t('sign_in_link')}
          </Link>
        </p>
      </div>
    );
  }

  if (userEmail !== props.invitation.email) {
    return (
      <div className="flex flex-col gap-8">
        <Heading workspaceName={workspace} title={t('wrong_title')}>
          {t('wrong_text', { workspace })}
        </Heading>
        <div className={PANEL}>
          <Person label={t('invited_label')} email={props.invitation.email} />
          <Person label={t('signed_in_label')} email={userEmail} name={props.user?.displayName} />
          <Button
            size="lg"
            className="mt-1 w-full"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await props.signOut(`/invite/${props.token}`);
              });
            }}
          >
            {pending ? (
              <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <LogOutIcon data-icon="inline-start" />
            )}
            {t('sign_out')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Heading workspaceName={workspace} title={t('join_title', { workspace })}>
        {t('invited_as', { role })}
      </Heading>
      <div className={PANEL}>
        <ActionAlert result={failure} />
        <Person label={t('signed_in_label')} email={userEmail} name={props.user?.displayName} />
        <Button
          size="lg"
          className="mt-1 h-auto min-h-11 w-full py-2.5 break-words whitespace-normal"
          disabled={pending}
          onClick={() => {
            setFailure(undefined);
            startTransition(async () => {
              // On success the action redirects, so a result means something went wrong.
              setFailure(await props.accept(props.token));
            });
          }}
        >
          {pending && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {t('join_button', { workspace })}
        </Button>
      </div>
    </div>
  );
};
