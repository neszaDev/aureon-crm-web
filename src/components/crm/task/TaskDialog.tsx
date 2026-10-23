'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2Icon,
  CalendarIcon,
  ContactRoundIcon,
  FlagIcon,
  HandshakeIcon,
  LoaderCircleIcon,
  UserPlusIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { createTask, updateTask } from '@/actions/crm/TaskActions';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { DateTimeField } from '@/components/crm/fields/DateTimeField';
import { OwnerField } from '@/components/crm/fields/OwnerField';
import { RecordPicker } from '@/components/crm/fields/RecordPicker';
import {
  CHIP_ROW,
  DateValue,
  PersonValue,
  PropertyChip,
  TITLE_INPUT,
  TitleField,
} from '@/components/crm/record/RecordForm';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
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
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import { toInstant, toLocalInput } from '@/libs/crm/ZonedTime';
import { applyFieldErrors } from '@/libs/form/ApplyFieldErrors';
import { useInFlight } from '@/utils/InFlight';
import { useSettle } from '@/utils/SettleAction';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';
import type { TaskFormValues, TaskValues } from '@/validations/crm/TaskValidation';
import { TASK_PRIORITIES, TaskFormValidation } from '@/validations/crm/TaskValidation';

type Task = components['schemas']['TaskResponse'];

// The links a picker sets, by the backend's field.
const LINKS = [
  { field: 'company', id: 'companyId', kind: 'company', icon: Building2Icon },
  { field: 'contact', id: 'contactId', kind: 'contact', icon: ContactRoundIcon },
  { field: 'lead', id: 'leadId', kind: 'lead', icon: UserPlusIcon },
  { field: 'deal', id: 'dealId', kind: 'deal', icon: HandshakeIcon },
] as const;

const isFormField = (field: string): field is keyof TaskFormValues =>
  field in TaskFormValidation.shape;

/** What the dialog edits or starts from: a task, or the record a new one is on. */
type TaskDialogProps = {
  workspaceId: number;
  task?: Task;
  link?: ActivityLink;
  linkLabel?: string;
  members: components['schemas']['MemberRef'][];
  me: number;
  canAssign: boolean;
  timeZone: string;
};

/**
 * A linked record as its picker shows it.
 * @param ref The record, if any.
 * @returns Its id and name, or null.
 */
const pick = (ref?: { id: number; name?: string; fullName?: string }) =>
  ref ? { id: ref.id, label: ref.name ?? ref.fullName ?? '' } : null;

/**
 * What the actions take from the form's values: the due time as an instant (an untouched one
 * exactly as saved, seconds and all), the links by id. A Company left as it was, under a contact
 * or deal, is the one derived from it: sent back it would stay when the contact changes, so none
 * is sent and the backend derives it again.
 * @param values The form's values.
 * @param timeZone The workspace's time zone, which the due time was entered in.
 * @param untouched What the form left as it was: `dueAt` is the saved due time (when so), and
 *   `company` tells whether Company was not touched.
 * @param untouched.dueAt The saved due time, when the field wasn't touched.
 * @param untouched.company Whether the Company picker wasn't touched.
 * @returns The values to send.
 */
const toTaskValues = (
  values: TaskFormValues,
  timeZone: string,
  untouched: { dueAt?: string; company: boolean },
): TaskValues => ({
  title: values.title,
  description: values.description,
  priority: values.priority,
  assigneeId: values.assigneeId,
  dueAt: untouched.dueAt ?? toInstant(values.dueAt, timeZone) ?? null,
  companyId:
    untouched.company && (values.contact || values.deal) ? null : (values.company?.id ?? null),
  contactId: values.contact?.id ?? null,
  leadId: values.lead?.id ?? null,
  dealId: values.deal?.id ?? null,
});

/**
 * The form's starting values: the task's, or a new task for the caller, due never, on the
 * record it is added from.
 * @param props The dialog's props.
 * @returns The values.
 */
const startingValues = (props: TaskDialogProps): TaskFormValues => {
  const linked: Partial<Record<string, number>> = props.link ?? {};
  const fromLink = (id: string) => {
    const value = linked[id];
    return value === undefined ? null : { id: value, label: props.linkLabel ?? '' };
  };

  return {
    title: props.task?.title ?? '',
    description: props.task?.description ?? '',
    dueAt: props.task?.dueAt ? toLocalInput(props.task.dueAt, props.timeZone) : '',
    priority: props.task?.priority ?? 'MEDIUM',
    assigneeId: props.task ? (props.task.assignee?.userId ?? null) : props.me,
    company: props.task ? pick(props.task.company) : fromLink('companyId'),
    contact: props.task ? pick(props.task.contact) : fromLink('contactId'),
    lead: props.task ? pick(props.task.lead) : fromLink('leadId'),
    deal: props.task ? pick(props.task.deal) : fromLink('dealId'),
  };
};

/**
 * The task's fields, mounted each time the dialog opens, so it starts from the saved values.
 * @param props The dialog's props.
 * @param props.onDone Closes the dialog once saved.
 * @param props.once Runs the save unless one is on its way (the dialog stays open meanwhile).
 * @returns The form.
 */
const TaskForm = (
  props: TaskDialogProps & {
    onDone: () => void;
    once: (run: () => Promise<void>) => Promise<void>;
  },
) => {
  const t = useTranslations('TaskDialog');
  const tRow = useTranslations('TaskRow');
  const settle = useSettle();
  const [failure, setFailure] = useState<ActionResult>();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormValidation),
    defaultValues: startingValues(props),
  });
  const { errors, isSubmitting } = form.formState;
  // What the priority's chip shows.
  const priority = useWatch({ control: form.control, name: 'priority' });
  // A link's own error (the backend's refusal of the record), typed as an object's by
  // react-hook-form.
  const linkError = (field: (typeof LINKS)[number]['field']) => {
    const message = errors[field]?.message;
    return message === undefined ? undefined : { type: 'server', message };
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    const body = toTaskValues(values, props.timeZone, {
      dueAt: form.getFieldState('dueAt').isDirty ? undefined : props.task?.dueAt,
      company: !form.getFieldState('company').isDirty,
    });
    const result = await settle(
      props.task
        ? updateTask(props.workspaceId, props.task.id, props.task.version, body)
        : createTask(props.workspaceId, body),
    );
    if (result.ok) {
      toast.success(props.task ? t('saved') : t('created'));
      props.onDone();
      return;
    }

    setFailure(
      applyFieldErrors(form, result, (name) => {
        const link = LINKS.find((item) => item.id === name);
        const field = link?.field ?? name;
        // On a record's own task the links aren't drawn: their error is the alert's.
        return isFormField(field) && !(link && props.link) ? field : undefined;
      }),
    );
  });

  return (
    <form
      method="post"
      onSubmit={(event) => {
        // Not a native POST, whether or not a request is already on its way.
        event.preventDefault();
        void props.once(async () => {
          await onSubmit(event);
        });
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <DialogHeader>
        <DialogTitle>{props.task ? t('edit_title') : t('new_title')}</DialogTitle>
        <DialogDescription>
          {props.link && props.linkLabel
            ? t('linked_to', { name: props.linkLabel })
            : t('description')}
        </DialogDescription>
      </DialogHeader>
      <ActionAlert result={failure} />
      <div className="flex flex-col gap-3">
        <TitleField id="task-title" label={t('title_label')} error={errors.title}>
          <Input
            id="task-title"
            autoComplete="off"
            placeholder={t('title_label')}
            className={TITLE_INPUT}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={describedBy('task-title')}
            {...form.register('title')}
          />
        </TitleField>
        <div className={CHIP_ROW}>
          <Controller
            control={form.control}
            name="assigneeId"
            render={(controller) => (
              <PropertyChip
                id="task-assignee-chip"
                label={t('assignee_label')}
                icon={UserRoundIcon}
                value={
                  <PersonValue
                    members={props.members}
                    me={props.me}
                    userId={controller.field.value}
                  />
                }
                error={errors.assigneeId}
              >
                <OwnerField
                  id="task-assignee"
                  label={t('assignee_label')}
                  value={controller.field.value}
                  onChange={(value) => {
                    controller.field.onChange(value);
                  }}
                  members={props.members}
                  me={props.me}
                  canAssign={props.canAssign}
                  allowUnassigned={props.task !== undefined}
                  error={errors.assigneeId}
                />
              </PropertyChip>
            )}
          />
          <Controller
            control={form.control}
            name="dueAt"
            render={(controller) => (
              <PropertyChip
                id="task-due-chip"
                label={t('due_label')}
                icon={CalendarIcon}
                value={
                  controller.field.value ? <DateValue value={controller.field.value} /> : undefined
                }
                error={errors.dueAt}
              >
                <DateTimeField
                  id="task-due"
                  label={t('due_label')}
                  value={controller.field.value}
                  onChange={(value) => {
                    controller.field.onChange(value);
                  }}
                  timeZone={props.timeZone}
                  clearable
                  error={errors.dueAt}
                />
              </PropertyChip>
            )}
          />
          <PropertyChip
            id="task-priority-chip"
            label={t('priority_label')}
            icon={FlagIcon}
            value={<span className="truncate">{tRow(`priority_${priority}`)}</span>}
            error={errors.priority}
          >
            <FormField htmlFor="task-priority" label={t('priority_label')} error={errors.priority}>
              <NativeSelect
                id="task-priority"
                defaultValue={priority}
                aria-invalid={errors.priority ? true : undefined}
                aria-describedby={describedBy('task-priority')}
                {...form.register('priority')}
              >
                {TASK_PRIORITIES.map((item) => (
                  <NativeSelectOption key={item} value={item}>
                    {tRow(`priority_${item}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
          </PropertyChip>
          {/* Added from a record, the task is on it; from the Tasks page, on what is picked. */}
          {!props.link &&
            LINKS.map((link) => (
              <Controller
                key={link.field}
                control={form.control}
                name={link.field}
                render={(controller) => (
                  <PropertyChip
                    id={`task-${link.field}-chip`}
                    label={t(`${link.field}_label`)}
                    icon={link.icon}
                    value={
                      controller.field.value ? (
                        <span className="truncate">{controller.field.value.label}</span>
                      ) : undefined
                    }
                    error={linkError(link.field)}
                  >
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`task-${link.field}`}>{t(`${link.field}_label`)}</Label>
                      <RecordPicker
                        id={`task-${link.field}`}
                        workspaceId={props.workspaceId}
                        kind={link.kind}
                        value={controller.field.value}
                        onChange={(value) => {
                          controller.field.onChange(value);
                        }}
                        invalid={errors[link.field] !== undefined}
                      />
                    </div>
                  </PropertyChip>
                )}
              />
            ))}
        </div>
        {!props.link && <p className="text-[0.8125rem] text-muted-foreground">{t('links_hint')}</p>}
      </div>
      <FormField
        htmlFor="task-description"
        label={t('description_label')}
        error={errors.description}
      >
        <Textarea
          id="task-description"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={describedBy('task-description')}
          {...form.register('description')}
        />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {props.task ? t('save') : t('create')}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * A task in a dialog: a new one (on the record it is added from, or on any records picked), or
 * an existing one to edit. The assignee starts as the caller; only `RECORDS_ASSIGN` changes it.
 * A refusal shows in the dialog; once saved it closes with a toast.
 * @param props Component props.
 * @param props.trigger The button that opens it.
 * @param props.workspaceId The workspace.
 * @param props.task The task to edit; without it the dialog creates one.
 * @param props.link The record a new task is on, such as `{ companyId: 7 }`.
 * @param props.linkLabel That record's name.
 * @param props.members The workspace's members, for the assignee.
 * @param props.me The caller's user id.
 * @param props.canAssign Whether the caller may give it to someone else (`RECORDS_ASSIGN`).
 * @param props.timeZone The workspace's time zone, which the due time is entered in.
 * @param props.defaultOpen Whether it opens at once (the Tasks page's `?new=1`, which the rail's
 *   "+ New" links to).
 * @returns The trigger and its dialog.
 */
export const TaskDialog = (
  props: TaskDialogProps & { trigger: React.ReactElement; defaultOpen?: boolean },
) => {
  const t = useTranslations('TaskDialog');
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  const inFlight = useInFlight();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing would lose the answer, and a second try would add the task twice.
        if (next || !inFlight.busy()) {
          setOpen(next);
        }
      }}
    >
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent
        closeLabel={t('close')}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
      >
        <TaskForm
          {...props}
          once={inFlight.once}
          onDone={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
