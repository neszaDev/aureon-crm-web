'use client';

import { InfoIcon, LoaderCircleIcon, LogOutIcon, UserMinusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useOptimistic, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { Seal } from '@/components/crm/Seal';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ActionResult } from '@/libs/api/ApiError';
import type { WorkspaceRole } from '@/validations/crm/MemberValidation';
import { assignableRoles } from '@/validations/crm/MemberValidation';

/** A member as the table shows it; `joined` is already a formatted date. */
export type MemberRow = {
  userId: number;
  email: string;
  displayName?: string;
  role: WorkspaceRole;
  joined: string;
};

type MemberActions = {
  changeRole: (userId: number, role: WorkspaceRole) => Promise<ActionResult>;
  remove: (userId: number) => Promise<ActionResult>;
};

/**
 * One member: seal and name, role (a select when the caller may change it), when they joined,
 * and remove (or leave, on your own row). Changing your own role asks first: it can take away
 * your right to change it back.
 * @param props Component props.
 * @param props.member The member.
 * @param props.isMe Whether it is the signed-in user.
 * @param props.lastOwner Whether it is your row and you are the only owner.
 * @param props.manageable Whether the caller may change this member's role or remove them.
 * @param props.roles The roles the caller may give.
 * @param props.workspaceName The workspace, named in the confirmations.
 * @param props.actions The member actions.
 * @returns The table row.
 */
const MemberTableRow = (props: {
  member: MemberRow;
  isMe: boolean;
  lastOwner: boolean;
  manageable: boolean;
  roles: readonly WorkspaceRole[];
  workspaceName: string;
  actions: MemberActions;
}) => {
  const t = useTranslations('MembersTable');
  const tRole = useTranslations('Roles');
  const [isPending, startTransition] = useTransition();
  // Shows the chosen role while it saves; it falls back to the saved one if the backend refuses.
  const [role, setRole] = useOptimistic(props.member.role);
  // Your own new role, waiting for your confirmation.
  const [ownRole, setOwnRole] = useState<WorkspaceRole>();
  const [confirmingOwnRole, setConfirmingOwnRole] = useState(false);
  const select = useRef<HTMLSelectElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const name = props.member.displayName ?? props.member.email;

  return (
    // Below sm the row stacks: name and email, then role and actions on one line.
    <TableRow className="max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-2 max-sm:px-4 max-sm:py-3">
      {/* Takes the free width; long names wrap and emails truncate instead of widening the
          table. */}
      <TableCell className="w-full max-w-0 py-2.5 whitespace-normal max-sm:col-span-2 max-sm:w-auto max-sm:max-w-none max-sm:p-0">
        <span className="flex min-w-0 items-center gap-3">
          <Seal name={props.member.displayName} email={props.member.email} size="sm" />
          <span className="flex min-w-0 flex-col">
            <span ref={nameRef} tabIndex={-1} className="rounded-sm font-medium break-words">
              {name}
              {props.isMe && (
                <span className="font-normal text-muted-foreground"> · {t('you')}</span>
              )}
            </span>
            {props.member.displayName && (
              <span
                title={props.member.email}
                className="truncate text-[0.8125rem] text-muted-foreground"
              >
                {props.member.email}
              </span>
            )}
          </span>
        </span>
      </TableCell>
      <TableCell className="max-sm:p-0">
        {props.manageable ? (
          <span className="flex items-center gap-2">
            <NativeSelect
              ref={select}
              size="sm"
              aria-label={t('role_of', { name })}
              value={role}
              className="min-w-32"
              onChange={(event) => {
                const next = props.roles.find((item) => item === event.target.value);
                if (!next) {
                  return;
                }
                if (props.isMe) {
                  // The select keeps the saved role until the dialog's answer.
                  setOwnRole(next);
                  setConfirmingOwnRole(true);
                  return;
                }
                startTransition(async () => {
                  setRole(next);
                  const result = await props.actions.changeRole(props.member.userId, next);
                  if (!result.ok) {
                    toast.error(result.message ?? t('error_generic'));
                  }
                });
              }}
            >
              {props.roles.map((item) => (
                <NativeSelectOption key={item} value={item}>
                  {tRole(`role_${item}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {isPending && (
              <span className="flex items-center text-muted-foreground">
                <LoaderCircleIcon aria-hidden="true" className="size-4 shrink-0 animate-spin" />
                <span className="sr-only">{t('saving')}</span>
              </span>
            )}
          </span>
        ) : (
          tRole(`role_${role}`)
        )}
        {/* Outside the select's branch, so it closes normally when the new role removes the
            select. */}
        {props.isMe && (
          <ConfirmAction
            open={confirmingOwnRole}
            onOpenChange={setConfirmingOwnRole}
            // After a change that took away your right to manage, the select is gone:
            // the focus goes to your name instead of the page's start.
            returnFocus={() => select.current ?? nameRef.current}
            title={t('self_role_title', { role: ownRole ? tRole(`role_${ownRole}`) : '' })}
            description={t('self_role_text')}
            confirmLabel={t('self_role_confirm')}
            cancelLabel={t('cancel')}
            action={async () =>
              ownRole ? await props.actions.changeRole(props.member.userId, ownRole) : { ok: true }
            }
          />
        )}
      </TableCell>
      <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
        {props.member.joined}
      </TableCell>
      <TableCell className="w-px text-right max-sm:w-auto max-sm:p-0">
        {props.isMe ? (
          <ConfirmAction
            trigger={
              <Button variant="ghost" size="sm" aria-label={t('leave')}>
                <LogOutIcon data-icon="inline-start" />
                <span className="sm:max-md:sr-only">{t('leave')}</span>
              </Button>
            }
            title={t('leave_title', { workspace: props.workspaceName })}
            description={t('leave_text')}
            confirmLabel={t('leave')}
            cancelLabel={t('cancel')}
            action={async () => await props.actions.remove(props.member.userId)}
          >
            {/* The backend refuses it anyway; saying so first saves a try. */}
            {props.lastOwner && (
              <p className="flex items-start gap-2.5 rounded-md border border-rule bg-muted px-3.5 py-3 text-sm font-medium">
                <InfoIcon
                  aria-hidden="true"
                  className="mt-px size-4 shrink-0 text-muted-foreground"
                />
                {t('leave_last_owner')}
              </p>
            )}
          </ConfirmAction>
        ) : (
          props.manageable && (
            <ConfirmAction
              trigger={
                <Button variant="ghost" size="sm" aria-label={t('remove_label', { name })}>
                  <UserMinusIcon data-icon="inline-start" />
                  <span className="sm:max-md:sr-only">{t('remove')}</span>
                </Button>
              }
              title={t('remove_title', { name, workspace: props.workspaceName })}
              description={t('remove_text')}
              confirmLabel={t('remove')}
              cancelLabel={t('cancel')}
              action={async () => await props.actions.remove(props.member.userId)}
            />
          )
        )}
      </TableCell>
    </TableRow>
  );
};

/**
 * The workspace's members. Owners and admins (`MEMBERS_MANAGE`) change roles and remove
 * members, but only owners touch owners, so an admin sees no control on an owner's row and can't
 * give the owner role. Everyone can leave. The backend checks every rule again; its refusal is
 * shown and the row keeps its saved role.
 * @param props Component props.
 * @param props.members The members.
 * @param props.me The signed-in user's id.
 * @param props.callerRole The signed-in user's role here.
 * @param props.canManage Whether they have `MEMBERS_MANAGE`.
 * @param props.workspaceName The workspace's name.
 * @param props.actions Changes a role; removes a member.
 * @returns The table.
 */
export const MembersTable = (props: {
  members: MemberRow[];
  me: number;
  callerRole: WorkspaceRole;
  canManage: boolean;
  workspaceName: string;
  actions: MemberActions;
}) => {
  const t = useTranslations('MembersTable');
  const ownerRules = props.callerRole === 'OWNER';
  const roles = assignableRoles(props.callerRole);
  const lastOwner =
    ownerRules && props.members.filter((member) => member.role === 'OWNER').length === 1;

  return (
    <Table>
      <TableHeader className="max-sm:sr-only">
        <TableRow>
          <TableHead>{t('member')}</TableHead>
          <TableHead>{t('role')}</TableHead>
          <TableHead className="hidden sm:table-cell">{t('joined')}</TableHead>
          <TableHead>
            <span className="sr-only">{t('actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.members.map((member) => (
          <MemberTableRow
            key={member.userId}
            member={member}
            isMe={member.userId === props.me}
            lastOwner={lastOwner && member.userId === props.me}
            manageable={props.canManage && (ownerRules || member.role !== 'OWNER')}
            roles={roles}
            workspaceName={props.workspaceName}
            actions={props.actions}
          />
        ))}
      </TableBody>
    </Table>
  );
};
