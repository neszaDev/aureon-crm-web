'use client';

import { useTranslations } from 'next-intl';
import type { FieldError as HookFormFieldError } from 'react-hook-form';
import { Seal } from '@/components/crm/Seal';
import { FieldError } from '@/components/FieldError';
import { describedBy } from '@/components/FormField';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { components } from '@/libs/api/schema';

type Member = components['schemas']['MemberRef'];

// The "Unassigned" option's value: a select item can't have an empty one.
const UNASSIGNED = 'unassigned';

/**
 * Who owns a record, for a form that controls it (react-hook-form `Controller`). With
 * `RECORDS_ASSIGN` it is a select of the members, by seal and name; without it, the owner
 * written out, and the form still sends the current one (keeping it needs no permission).
 * @param props Component props.
 * @param props.id The select's id.
 * @param props.label The field's label.
 * @param props.value The owner's user id, or null for none.
 * @param props.onChange Called with the chosen owner.
 * @param props.members The workspace's members.
 * @param props.me The caller's user id, marked "you".
 * @param props.canAssign Whether the caller may change the owner (`RECORDS_ASSIGN`).
 * @param props.allowUnassigned Whether "Unassigned" is offered: editing only, as a new record
 *   without an owner is the caller's.
 * @param props.error The backend's refusal of the owner (someone who left meanwhile).
 * @returns The field.
 */
export const OwnerField = (props: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  members: Member[];
  me: number;
  canAssign: boolean;
  allowUnassigned: boolean;
  error?: HookFormFieldError;
}) => {
  const t = useTranslations('OwnerField');
  const nameOf = (member: Member) =>
    member.userId === props.me
      ? t('you', { name: member.displayName ?? member.email })
      : (member.displayName ?? member.email);

  if (!props.canAssign) {
    const owner = props.members.find((member) => member.userId === props.value);

    return (
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-[0.8125rem] leading-snug font-medium text-muted-foreground">
          {props.label}
        </span>
        <p className="flex min-h-10 items-center gap-2 font-medium break-words">
          {owner ? (
            <>
              <Seal name={owner.displayName} email={owner.email} size="sm" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{nameOf(owner)}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{t('unassigned')}</span>
          )}
        </p>
        <p className="text-[0.8125rem] text-muted-foreground">{t('read_only')}</p>
        <FieldError error={props.error} />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Select
        value={props.value === null ? UNASSIGNED : String(props.value)}
        onValueChange={(next) => {
          props.onChange(next === UNASSIGNED ? null : Number(next));
        }}
      >
        <SelectTrigger
          id={props.id}
          aria-invalid={props.error ? true : undefined}
          aria-describedby={props.error ? describedBy(props.id) : undefined}
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {props.allowUnassigned && <SelectItem value={UNASSIGNED}>{t('unassigned')}</SelectItem>}
          {props.members.map((member) => (
            <SelectItem key={member.userId} value={String(member.userId)}>
              <Seal name={member.displayName} email={member.email} size="sm" />
              {nameOf(member)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError error={props.error} id={describedBy(props.id)} />
    </div>
  );
};
