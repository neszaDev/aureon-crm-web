import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { createInvitation, revokeInvitation } from '@/actions/crm/InvitationActions';
import { changeMemberRole, removeMember } from '@/actions/crm/MemberActions';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InviteDialog } from '@/components/crm/settings/InviteDialog';
import { MembersTable } from '@/components/crm/settings/MembersTable';
import { PendingInvitations } from '@/components/crm/settings/PendingInvitations';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { getInvitations, getMembers } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import type { components } from '@/libs/api/schema';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { can } from '@/libs/crm/Permissions';
import { assignableRoles } from '@/validations/crm/MemberValidation';

type MembersPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

type Schemas = components['schemas'];

/**
 * The members as the table shows them.
 * @param members The backend's members.
 * @param date Formats an instant as a date.
 * @returns The rows.
 */
const toMemberRows = (members: Schemas['MemberResponse'][], date: (iso?: string) => string) =>
  members.flatMap((member) =>
    member.userId === undefined || !member.role
      ? []
      : [
          {
            userId: member.userId,
            email: member.email ?? '',
            displayName: member.displayName,
            role: member.role,
            joined: date(member.joinedAt),
          },
        ],
  );

/**
 * The pending invitations as the list shows them. Only owners revoke an owner invitation.
 * @param invitations The backend's invitations.
 * @param date Formats an instant as a date.
 * @param ownerRules Whether the caller is an owner.
 * @returns The rows.
 */
const toPendingInvitations = (
  invitations: Schemas['InvitationResponse'][],
  date: (iso?: string) => string,
  ownerRules: boolean,
) =>
  invitations.flatMap((invitation) =>
    invitation.id === undefined || !invitation.role
      ? []
      : [
          {
            id: invitation.id,
            email: invitation.email ?? '',
            role: invitation.role,
            invitedBy: invitation.invitedBy?.displayName ?? invitation.invitedBy?.email,
            expires: date(invitation.expiresAt),
            canRevoke: ownerRules || invitation.role !== 'OWNER',
          },
        ],
  );

export async function generateMetadata(props: MembersPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'MembersPage' });
  const { forbidden } = await getMembers(workspaceId);

  return await workspacePageMetadata({ locale, workspaceId, title: t('title'), forbidden });
}

/**
 * Loads the members and, for someone with `MEMBERS_MANAGE`, the pending invitations.
 * @param workspaceId The `[workspaceId]` route segment.
 * @param withInvitations Whether to load the invitations.
 * @returns The lists, `unauthorized` (401) or `forbidden` (403 for the members); a 403 for the
 *   invitations leaves them undefined.
 * @throws {Error} When a list failed otherwise (5xx, network): the error boundary offers a retry.
 */
const loadMembers = async (workspaceId: string, withInvitations: boolean) => {
  const [members, invitations] = await Promise.all([
    getMembers(workspaceId),
    withInvitations ? getInvitations(workspaceId) : undefined,
  ]);
  if (members.unauthorized || invitations?.unauthorized) {
    return { unauthorized: true } as const;
  }
  if (members.forbidden) {
    return { forbidden: true } as const;
  }
  if (!members.members || (invitations && !invitations.invitations && !invitations.forbidden)) {
    throw new Error('Could not load the members');
  }

  return { members: members.members, invitations: invitations?.invitations };
};

export default async function MembersPage(props: MembersPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'MembersPage' });
  const format = await getFormatter({ locale });

  // The user and the workspace (cached calls); a lost workspace is "not found" even on a
  // client navigation, which renders the page without its layout.
  const [{ user }, { workspace }] = await Promise.all([
    getCurrentUser(),
    getOpenWorkspace(locale, workspaceId),
  ]);
  if (user?.id === undefined || workspace?.id === undefined || !workspace.role) {
    throw new Error('Could not load the workspace');
  }
  const canManage = can(workspace, 'MEMBERS_MANAGE');
  const loaded = await loadMembers(workspaceId, canManage);
  if ('unauthorized' in loaded) {
    return endRejectedSession(locale);
  }
  if ('forbidden' in loaded) {
    return <ForbiddenNotice page />;
  }

  const ownerRules = workspace.role === 'OWNER';
  const date = (iso?: string) =>
    iso
      ? format.dateTime(new Date(iso), { dateStyle: 'medium', timeZone: workspace.timezone })
      : '';
  const rows = toMemberRows(loaded.members, date);
  const pending = loaded.invitations && toPendingInvitations(loaded.invitations, date, ownerRules);

  return (
    <>
      <SettingsHeader
        title={t('title')}
        description={t('description')}
        action={
          canManage && (
            <InviteDialog
              action={createInvitation.bind(null, workspace.id)}
              roles={assignableRoles(workspace.role)}
              timeZone={workspace.timezone ?? 'UTC'}
            />
          )
        }
      />

      <section
        aria-labelledby="members-heading"
        className="overflow-hidden rounded-lg border border-rule bg-card"
      >
        <h2
          id="members-heading"
          tabIndex={-1}
          className="px-5 pt-4 pb-2 font-semibold focus-visible:-outline-offset-2"
        >
          {t('members_heading', { count: rows.length })}
        </h2>
        <MembersTable
          members={rows}
          me={user.id}
          callerRole={workspace.role}
          canManage={canManage}
          workspaceName={workspace.name}
          headingId="members-heading"
          actions={{
            changeRole: changeMemberRole.bind(null, workspace.id),
            remove: removeMember.bind(null, workspace.id),
          }}
        />
      </section>

      {canManage && (
        <section
          aria-labelledby="invitations-heading"
          className="overflow-hidden rounded-lg border border-rule bg-card"
        >
          <h2
            id="invitations-heading"
            tabIndex={-1}
            className="px-5 pt-4 pb-3 font-semibold focus-visible:-outline-offset-2"
          >
            {t('invitations_heading')}
          </h2>
          {pending ? (
            <PendingInvitations
              invitations={pending}
              revoke={revokeInvitation.bind(null, workspace.id)}
              headingId="invitations-heading"
            />
          ) : (
            <div className="border-t border-rule p-4">
              <ForbiddenNotice />
            </div>
          )}
        </section>
      )}
    </>
  );
}
