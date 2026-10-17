'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from 'cn';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  LoaderCircleIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { describedBy, FormField } from '@/components/FormField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/libs/api/ApiError';
import { focusOnMount } from '@/utils/Focus';
import type {
  LeadSourceUpdateValues,
  LeadSourceValues,
} from '@/validations/crm/LeadSourceValidation';
import { LeadSourceValidation } from '@/validations/crm/LeadSourceValidation';

/** A lead source as the list shows it. */
export type Source = { id: number; name: string; archived: boolean; version: number };

type SourceActions = {
  create: (values: LeadSourceValues) => Promise<ActionResult>;
  update: (
    sourceId: number,
    version: number,
    values: LeadSourceUpdateValues,
  ) => Promise<ActionResult>;
  remove: (sourceId: number) => Promise<ActionResult>;
};

/**
 * A lead source's name, to add a source or rename one.
 * @param props Component props.
 * @param props.id Id of the name field.
 * @param props.defaults The starting value.
 * @param props.submitLabel The button's label.
 * @param props.autoFocus Whether the name takes focus (an editor opened by the user).
 * @param props.onSubmit Saves the name.
 * @param props.onSaved Called after a save; the form is reset to its defaults.
 * @param props.onCancel Closes an editor; without it there is no cancel button.
 * @returns The form.
 */
const SourceForm = (props: {
  id: string;
  defaults: LeadSourceValues;
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (values: LeadSourceValues) => Promise<ActionResult>;
  onSaved?: () => void;
  onCancel?: () => void;
}) => {
  const t = useTranslations('SourceList');
  const [failure, setFailure] = useState<ActionResult>();
  const form = useForm<LeadSourceValues>({
    resolver: zodResolver(LeadSourceValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    const result = await props.onSubmit(values);
    if (result.ok) {
      form.reset(props.defaults);
      props.onSaved?.();
      return;
    }

    if (result.fieldErrors?.name) {
      form.setError('name', { type: 'server', message: result.fieldErrors.name });
    }
    setFailure(result);
  });

  return (
    <form onSubmit={onSubmit} className="flex min-w-0 flex-1 flex-col gap-3" noValidate>
      <ActionAlert result={failure} />
      <FormField htmlFor={props.id} label={t('name_label')} error={errors.name}>
        <Input
          id={props.id}
          autoComplete="off"
          // The user opened this editor: typing goes straight to the name.
          autoFocus={props.autoFocus}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy(props.id)}
          className="max-w-md"
          {...form.register('name')}
        />
      </FormField>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {props.submitLabel}
        </Button>
        {props.onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={props.onCancel}>
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
};

/**
 * One source: its name, "Archived" when it is, and for managers rename, archive or restore, and
 * delete.
 * @param props Component props.
 * @param props.source The source.
 * @param props.canManage Whether the caller may change the sources.
 * @param props.actions The source actions.
 * @returns The list item.
 */
const SourceItem = (props: { source: Source; canManage: boolean; actions: SourceActions }) => {
  const t = useTranslations('SourceList');
  const [editing, setEditing] = useState(false);
  // Once an editor has closed, its Rename button takes the focus back when it reappears.
  const [edited, setEdited] = useState(false);
  const [isPending, startTransition] = useTransition();
  const closeEditor = () => {
    setEditing(false);
    setEdited(true);
  };

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule px-4 py-2.5 sm:px-5">
      {editing ? (
        <SourceForm
          id={`source-${props.source.id}-name`}
          defaults={{ name: props.source.name }}
          submitLabel={t('save')}
          autoFocus
          onSubmit={async (values) =>
            await props.actions.update(props.source.id, props.source.version, {
              ...values,
              archived: props.source.archived,
            })
          }
          onSaved={closeEditor}
          onCancel={closeEditor}
        />
      ) : (
        <>
          <span className="flex min-w-0 flex-1 basis-40 flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              data-source-name
              className={cn(
                'font-medium break-words',
                props.source.archived && 'text-muted-foreground',
              )}
            >
              {props.source.name}
            </span>
            {props.source.archived && <Badge variant="outline">{t('archived')}</Badge>}
          </span>
          {props.canManage && (
            <span className="ml-auto flex shrink-0 items-center gap-0.5">
              <Button
                ref={edited ? focusOnMount : undefined}
                variant="ghost"
                size="icon-sm"
                aria-label={t('rename', { name: props.source.name })}
                onClick={() => {
                  setEditing(true);
                }}
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={
                  props.source.archived
                    ? t('restore_label', { name: props.source.name })
                    : t('archive_label', { name: props.source.name })
                }
                aria-busy={isPending || undefined}
                onClick={() => {
                  if (isPending) {
                    return;
                  }
                  startTransition(async () => {
                    const result = await props.actions.update(
                      props.source.id,
                      props.source.version,
                      {
                        name: props.source.name,
                        archived: !props.source.archived,
                      },
                    );
                    if (!result.ok) {
                      toast.error(result.message ?? t('error_generic'));
                    }
                  });
                }}
              >
                {isPending && (
                  <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
                )}
                {!isPending &&
                  (props.source.archived ? (
                    <ArchiveRestoreIcon data-icon="inline-start" />
                  ) : (
                    <ArchiveIcon data-icon="inline-start" />
                  ))}
                <span className="max-md:sr-only">
                  {props.source.archived ? t('restore') : t('archive')}
                </span>
              </Button>
              <ConfirmAction
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('delete', { name: props.source.name })}
                  >
                    <Trash2Icon />
                  </Button>
                }
                title={t('delete_title', { name: props.source.name })}
                description={t('delete_text')}
                confirmLabel={t('delete_confirm')}
                cancelLabel={t('cancel')}
                action={async () => await props.actions.remove(props.source.id)}
              />
            </span>
          )}
        </>
      )}
    </li>
  );
};

/**
 * Where leads come from: referrals, events, the website. Owners and admins (`SETTINGS_MANAGE`)
 * add, rename, archive (offered no more, kept on the records that use it) and delete them.
 * @param props Component props.
 * @param props.sources Every source, archived ones included, by name.
 * @param props.canManage Whether the caller may change them.
 * @param props.actions The source actions, bound to the workspace.
 * @returns The list and the form to add a source.
 */
export const SourceList = (props: {
  sources: Source[];
  canManage: boolean;
  actions: SourceActions;
}) => {
  const t = useTranslations('SourceList');

  return (
    <div className="flex flex-col">
      {props.sources.length > 0 ? (
        <ul aria-label={t('label')}>
          {props.sources.map((source) => (
            <SourceItem
              key={source.id}
              source={source}
              canManage={props.canManage}
              actions={props.actions}
            />
          ))}
        </ul>
      ) : (
        <p className="border-t border-rule px-4 py-4 text-muted-foreground sm:px-5">{t('empty')}</p>
      )}
      {props.canManage && (
        <div className="flex flex-col gap-3 border-t border-rule bg-muted/40 px-4 py-4 sm:px-5">
          <h3 className="font-semibold">{t('add_title')}</h3>
          <SourceForm
            id="new-source-name"
            defaults={{ name: '' }}
            submitLabel={t('add')}
            onSubmit={async (values) => await props.actions.create(values)}
          />
        </div>
      )}
    </div>
  );
};
