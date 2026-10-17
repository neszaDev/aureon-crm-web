'use client';

import type { UniqueIdentifier } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from 'cn';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleAlertIcon,
  GripVerticalIcon,
  LoaderCircleIcon,
  LockIcon,
  PencilIcon,
  RotateCwIcon,
  Trash2Icon,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/libs/api/ApiError';
import type { Stage } from '@/libs/crm/Stages';
import { focusOnMount } from '@/utils/Focus';
import type { StageValues } from '@/validations/crm/PipelineValidation';
import { StageValidation } from '@/validations/crm/PipelineValidation';

type StageActions = {
  create: (values: StageValues) => Promise<ActionResult>;
  update: (stageId: number, version: number, values: StageValues) => Promise<ActionResult>;
  reorder: (stageIds: number[]) => Promise<ActionResult & { stages?: Stage[] }>;
  remove: (stageId: number) => Promise<ActionResult>;
};

const isFormField = (field: string): field is keyof StageValues => field in StageValidation.shape;

/**
 * A stage's name and win probability, to add a stage or change one.
 * @param props Component props.
 * @param props.id Prefix of the fields' ids.
 * @param props.defaults The starting values.
 * @param props.submitLabel The button's label.
 * @param props.autoFocus Whether the name takes focus (an editor opened by the user).
 * @param props.onSubmit Saves the values.
 * @param props.onSaved Called after a save; the form is reset to its defaults.
 * @param props.onCancel Closes an editor; without it there is no cancel button.
 * @returns The form.
 */
const StageForm = (props: {
  id: string;
  defaults: StageValues;
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (values: StageValues) => Promise<ActionResult>;
  onSaved?: () => void;
  onCancel?: () => void;
}) => {
  const t = useTranslations('StageList');
  const [failure, setFailure] = useState<ActionResult>();
  const form = useForm<StageValues>({
    resolver: zodResolver(StageValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting } = form.formState;
  const nameId = `${props.id}-name`;
  const probabilityId = `${props.id}-probability`;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    const result = await props.onSubmit(values);
    if (result.ok) {
      form.reset(props.defaults);
      props.onSaved?.();
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
    <form onSubmit={onSubmit} className="flex min-w-0 flex-1 flex-col gap-3" noValidate>
      <ActionAlert result={failure} />
      <div className="flex flex-wrap items-start gap-3">
        <FormField
          htmlFor={nameId}
          label={t('name_label')}
          error={errors.name}
          className="min-w-44 flex-1"
        >
          <Input
            id={nameId}
            autoComplete="off"
            // The user opened this editor: typing goes straight to the name.
            autoFocus={props.autoFocus}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy(nameId)}
            // In the server's HTML too, not only once hydrated.
            defaultValue={props.defaults.name}
            {...form.register('name')}
          />
        </FormField>
        <FormField
          htmlFor={probabilityId}
          label={t('probability_label')}
          error={errors.probability}
          className="w-36"
        >
          <Input
            id={probabilityId}
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            aria-invalid={errors.probability ? true : undefined}
            aria-describedby={describedBy(probabilityId)}
            defaultValue={props.defaults.probability}
            {...form.register('probability', { valueAsNumber: true })}
          />
        </FormField>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {props.submitLabel}
        </Button>
        {props.onCancel && (
          <Button type="button" variant="ghost" onClick={props.onCancel}>
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
};

/**
 * One stage: its stamp box with its place, name, probability and, for managers, its tools. An
 * open stage has a drag handle, move up and down buttons and delete; Won and Lost have none. An
 * editor replaces the name and probability while it is open.
 * @param props Component props.
 * @param props.stage The stage.
 * @param props.position Its place in the pipeline, from 1.
 * @param props.openCount How many open stages there are.
 * @param props.canManage Whether the caller may change the pipeline.
 * @param props.saving Whether an order is being saved (moves wait for it).
 * @param props.focusKey The move button to focus after the list changed (`<id>:<offset>`).
 * @param props.actions The stage actions.
 * @param props.onMove Saves the order with this open stage moved by one place.
 * @returns The list item.
 */
const StageItem = (props: {
  stage: Stage;
  position: number;
  openCount: number;
  canManage: boolean;
  saving: boolean;
  focusKey?: string;
  actions: StageActions;
  onMove: (offset: -1 | 1, focusKey: string) => Promise<void>;
}) => {
  const t = useTranslations('StageList');
  const format = useFormatter();
  const [editing, setEditing] = useState(false);
  // Once an editor has closed, its Edit button takes the focus back when it reappears.
  const [edited, setEdited] = useState(false);
  const isOpen = props.stage.kind === 'OPEN';
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.stage.id,
    // Won and Lost stay pinned at the end.
    disabled: !isOpen || !props.canManage || props.saving,
    attributes: { roleDescription: t('drag_role') },
  });
  const closeEditor = () => {
    setEditing(false);
    setEdited(true);
  };
  const moveButton = (offset: -1 | 1) => {
    const key = `${props.stage.id}:${offset}`;
    const unavailable =
      props.saving || (offset < 0 ? props.position === 1 : props.position === props.openCount);

    return (
      <Button
        // A moved row loses focus when the list is re-ordered: give it back.
        ref={props.focusKey === key ? focusOnMount : undefined}
        variant="ghost"
        size="icon-sm"
        aria-label={
          offset < 0
            ? t('move_up', { name: props.stage.name })
            : t('move_down', { name: props.stage.name })
        }
        // aria-disabled, not disabled: the button keeps focus while the order saves.
        aria-disabled={unavailable || undefined}
        className="aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
        onClick={async () => {
          if (!unavailable) {
            await props.onMove(offset, key);
          }
        }}
      >
        {offset < 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
      </Button>
    );
  };

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule bg-card px-4 py-2.5 motion-reduce:transition-none! sm:px-5',
        isDragging && 'relative z-10 shadow-sheet',
      )}
    >
      {props.canManage &&
        (isOpen ? (
          <Button
            ref={setActivatorNodeRef}
            variant="ghost"
            size="icon-sm"
            className="cursor-grab touch-none active:cursor-grabbing"
            aria-label={t('drag', { name: props.stage.name })}
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon />
          </Button>
        ) : (
          <span className="grid size-8 shrink-0 place-items-center text-muted-foreground">
            <LockIcon aria-hidden="true" className="size-4" />
          </span>
        ))}
      {/* The stage box of the stamp row, numbered with the stage's place. */}
      <span
        aria-hidden="true"
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-[3px] border border-seal-ink/40 font-mono text-[0.8125rem] tabular-nums',
          isOpen ? 'bg-field' : 'bg-seal-tint text-seal-ink',
        )}
      >
        {props.position}
      </span>
      {editing ? (
        <StageForm
          id={`stage-${props.stage.id}`}
          defaults={{ name: props.stage.name, probability: props.stage.probability }}
          submitLabel={t('save')}
          autoFocus
          onSubmit={async (values) =>
            await props.actions.update(props.stage.id, props.stage.version, values)
          }
          onSaved={closeEditor}
          onCancel={closeEditor}
        />
      ) : (
        <>
          <span className="flex min-w-0 flex-1 basis-36 flex-col">
            <span data-stage-name className="font-medium break-words">
              {props.stage.name}
            </span>
            {!isOpen && (
              <span className="text-[0.8125rem] text-muted-foreground">
                {props.stage.kind === 'WON' ? t('won_hint') : t('lost_hint')}
              </span>
            )}
          </span>
          <span className="w-12 shrink-0 text-right text-muted-foreground tabular-nums">
            {format.number(props.stage.probability / 100, { style: 'percent' })}
          </span>
          {props.canManage && (
            <span className="ml-auto flex shrink-0 items-center gap-0.5">
              {isOpen && moveButton(-1)}
              {isOpen && moveButton(1)}
              <Button
                ref={edited ? focusOnMount : undefined}
                variant="ghost"
                size="icon-sm"
                aria-label={t('edit', { name: props.stage.name })}
                onClick={() => {
                  setEditing(true);
                }}
              >
                <PencilIcon />
              </Button>
              {/* The pipeline keeps at least one open stage. */}
              {isOpen && props.openCount > 1 && (
                <ConfirmAction
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('delete', { name: props.stage.name })}
                    >
                      <Trash2Icon />
                    </Button>
                  }
                  title={t('delete_title', { name: props.stage.name })}
                  description={t('delete_text')}
                  confirmLabel={t('delete_confirm')}
                  cancelLabel={t('cancel')}
                  action={async () => await props.actions.remove(props.stage.id)}
                />
              )}
            </span>
          )}
        </>
      )}
    </li>
  );
};

/**
 * The pipeline's stages in order: the open ones, then Won and Lost, pinned at the end. Owners
 * and admins (`SETTINGS_MANAGE`) add, rename, delete and re-order the open stages, by dragging a
 * handle or with the up and down buttons. A new order shows once the server has saved it, in
 * the server's order; a refusal leaves the saved order and says why.
 * @param props Component props.
 * @param props.stages The stages, by position.
 * @param props.canManage Whether the caller may change the pipeline.
 * @param props.actions The stage actions, bound to the workspace.
 * @returns The list, its status line and the form to add a stage.
 */
export const StageList = (props: {
  stages: Stage[];
  canManage: boolean;
  actions: StageActions;
}) => {
  const t = useTranslations('StageList');
  // The server's answer to the last reorder, valid while the page still shows the stages that
  // reorder started from (a refresh brings the server's list anyway).
  const [saved, setSaved] = useState<{ from: Stage[]; stages: Stage[] }>();
  const tError = useTranslations('ActionError');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; failed?: boolean; conflict?: boolean }>();
  const [focusKey, setFocusKey] = useState<string>();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const stages = saved?.from === props.stages ? saved.stages : props.stages;
  const open = stages.filter((stage) => stage.kind === 'OPEN');
  const nameOf = (id: UniqueIdentifier) => stages.find((stage) => stage.id === id)?.name ?? '';

  const saveOrder = async (stageIds: number[], nextFocus?: string) => {
    const from = props.stages;
    setSaving(true);
    setFocusKey(undefined);
    setStatus({ text: t('order_saving') });
    let result: Awaited<ReturnType<StageActions['reorder']>> = { ok: false };
    try {
      result = await props.actions.reorder(stageIds);
    } finally {
      // Also when the action throws, so "Saving the order…" never stays on screen.
      setSaving(false);
      setFocusKey(nextFocus);
      if (result.ok && result.stages) {
        setSaved({ from, stages: result.stages });
        setStatus({ text: t('order_saved') });
      } else {
        setStatus({
          text: result.message ?? t('error_generic'),
          failed: true,
          conflict: result.conflict,
        });
      }
    }
  };

  return (
    <div className="flex flex-col">
      {props.canManage && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pb-3 sm:px-5">
          <p className="text-sm text-muted-foreground">{t('reorder_hint')}</p>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <output
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium',
                status?.failed ? 'text-danger' : 'text-muted-foreground',
              )}
            >
              {status?.failed && <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0" />}
              {status?.text}
            </output>
            {status?.conflict && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  window.location.reload();
                }}
              >
                <RotateCwIcon data-icon="inline-start" />
                {tError('reload')}
              </Button>
            )}
          </span>
        </div>
      )}
      <DndContext
        // A fixed id keeps its generated aria ids the same on the server and in the browser.
        id="pipeline-stages"
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{
          screenReaderInstructions: { draggable: t('drag_instructions') },
          announcements: {
            onDragStart: (event) => t('drag_start', { name: nameOf(event.active.id) }),
            onDragOver: (event) => {
              if (!event.over) {
                return t('drag_away', { name: nameOf(event.active.id) });
              }
              // Over its own place (as it is when picked up): "Picked up" stays.
              return event.over.id === event.active.id
                ? undefined
                : t('drag_over', { name: nameOf(event.active.id), target: nameOf(event.over.id) });
            },
            onDragEnd: (event) =>
              event.over
                ? t('drag_end', { name: nameOf(event.active.id), target: nameOf(event.over.id) })
                : t('drag_cancel', { name: nameOf(event.active.id) }),
            onDragCancel: (event) => t('drag_cancel', { name: nameOf(event.active.id) }),
          },
        }}
        onDragEnd={async (event) => {
          const from = open.findIndex((stage) => stage.id === event.active.id);
          const to = open.findIndex((stage) => stage.id === event.over?.id);
          if (from !== -1 && to !== -1 && from !== to) {
            await saveOrder(
              arrayMove(
                open.map((stage) => stage.id),
                from,
                to,
              ),
            );
          }
        }}
      >
        <SortableContext
          items={open.map((stage) => stage.id)}
          strategy={verticalListSortingStrategy}
        >
          <ol aria-label={t('label')}>
            {/* The server lists the open stages first, so an open stage's index is its index
                among them too. */}
            {stages.map((stage, index) => (
              <StageItem
                key={stage.id}
                stage={stage}
                position={index + 1}
                openCount={open.length}
                canManage={props.canManage}
                saving={saving}
                focusKey={focusKey}
                actions={props.actions}
                onMove={async (offset, nextFocus) => {
                  await saveOrder(
                    arrayMove(
                      open.map((item) => item.id),
                      index,
                      index + offset,
                    ),
                    nextFocus,
                  );
                }}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {props.canManage && (
        <div className="flex flex-col gap-3 border-t border-rule bg-muted/40 px-4 py-4 sm:px-5">
          <h3 className="font-semibold">{t('add_title')}</h3>
          <StageForm
            id="new-stage"
            defaults={{ name: '', probability: 50 }}
            submitLabel={t('add')}
            onSubmit={async (values) => await props.actions.create(values)}
          />
        </div>
      )}
    </div>
  );
};
