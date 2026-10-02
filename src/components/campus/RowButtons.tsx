'use client';

import { ListPlusIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * An icon button with a tooltip that names it.
 * @param props Component props.
 * @param props.label Name of the action (tooltip and accessible name).
 * @param props.tone Add (outline) or remove (red).
 * @param props.onClick Runs the action.
 * @returns The button.
 */
const RowButton = (props: { label: string; tone: 'add' | 'remove'; onClick: () => void }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label={props.label}
        onClick={props.onClick}
        className={props.tone === 'remove' ? 'text-pen hover:border-pen/40' : 'text-pass'}
      >
        {props.tone === 'add' ? <ListPlusIcon /> : <Trash2Icon />}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{props.label}</TooltipContent>
  </Tooltip>
);

/**
 * The add and remove buttons of a multi-language row (Vue: "Add" and "Remove" tooltips).
 * @param props Component props.
 * @param props.row Row number, for the accessible names.
 * @param props.onAdd Appends a new row.
 * @param props.onRemove Removes this row.
 * @returns The two buttons.
 */
export const RowButtons = (props: { row: number; onAdd: () => void; onRemove: () => void }) => {
  const t = useTranslations('CampusContent');

  return (
    <div className="flex gap-2 sm:justify-end">
      <RowButton label={t('add')} tone="add" onClick={props.onAdd} />
      <RowButton label={t('remove', { row: props.row })} tone="remove" onClick={props.onRemove} />
    </div>
  );
};
