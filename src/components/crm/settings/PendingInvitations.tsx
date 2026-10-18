'use client';

import { MailIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/libs/api/ApiError';
import type { WorkspaceRole } from '@/validations/crm/MemberValidation';

/** A pending invitation as the list shows it; dates are already formatted. */
export type PendingInvitation = {
  id: number;
  email: string;
  role: WorkspaceRole;
  invitedBy?: string;
  expires: string;
  canRevoke: boolean;
};

/**
 * The invitations nobody has used yet, newest first (expired ones are not listed). Each can be
 * revoked, except an owner invitation by an admin: only owners manage owners.
 * @param props Component props.
 * @param props.invitations The invitations.
 * @param props.revoke Revokes one (`revokeInvitation` bound to the workspace).
 * @param props.headingId The id of the heading above the list (focusable), for after a revoke.
 * @returns The list, or a short explanation when it is empty.
 */
export const PendingInvitations = (props: {
  invitations: PendingInvitation[];
  revoke: (invitationId: number) => Promise<ActionResult>;
  headingId: string;
}) => {
  const t = useTranslations('PendingInvitations');
  const tRole = useTranslations('Roles');

  if (props.invitations.length === 0) {
    return <p className="border-t border-rule px-5 py-4 text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <ul>
      {props.invitations.map((invitation) => (
        // Below sm the row stacks like a member's: the whole email and details, then revoke.
        <li
          key={invitation.id}
          className="flex items-center gap-x-3 gap-y-2 border-t border-rule px-5 py-3 max-sm:grid max-sm:grid-cols-[auto_minmax(0,1fr)] max-sm:items-start"
        >
          <MailIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground max-sm:mt-1"
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium max-sm:break-all sm:truncate">{invitation.email}</span>
            <span className="text-[0.8125rem] text-muted-foreground">
              {invitation.invitedBy
                ? t('details_by', {
                    role: tRole(`role_${invitation.role}`),
                    name: invitation.invitedBy,
                    date: invitation.expires,
                  })
                : t('details', {
                    role: tRole(`role_${invitation.role}`),
                    date: invitation.expires,
                  })}
            </span>
          </span>
          {invitation.canRevoke && (
            <ConfirmAction
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t('revoke_label', { email: invitation.email })}
                  className="max-sm:col-start-2 max-sm:justify-self-start"
                >
                  <XIcon data-icon="inline-start" />
                  <span className="sm:max-md:sr-only">{t('revoke')}</span>
                </Button>
              }
              title={t('revoke_title', { email: invitation.email })}
              description={t('revoke_text')}
              confirmLabel={t('revoke')}
              cancelLabel={t('cancel')}
              fallbackFocus={() =>
                document.querySelector<HTMLElement>(`#${CSS.escape(props.headingId)}`)
              }
              action={async () => await props.revoke(invitation.id)}
            />
          )}
        </li>
      ))}
    </ul>
  );
};
