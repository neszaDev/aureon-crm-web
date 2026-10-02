'use client';

import { cn } from 'cn';
import { TagIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MailLabel } from './data';
import { LABEL_DOT, MAIL_LABELS } from './data';

/**
 * The Vue `LabelDropdown`: adds a label to (or removes it from) the selected messages or the
 * draft.
 * @param props Component props.
 * @param props.checked Labels every target already has.
 * @param props.onToggle Called with the chosen label.
 * @param props.disabled Disable the menu (nothing selected).
 * @returns The labels menu.
 */
export const LabelMenu = (props: {
  checked: MailLabel[];
  onToggle: (label: MailLabel) => void;
  disabled?: boolean;
}) => {
  const t = useTranslations('EmailNav');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={props.disabled}
          aria-label={t('labels_menu')}
        >
          <TagIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('labels_title')}</DropdownMenuLabel>
        {MAIL_LABELS.map((label) => (
          <DropdownMenuCheckboxItem
            key={label}
            checked={props.checked.includes(label)}
            onCheckedChange={() => {
              props.onToggle(label);
            }}
          >
            <span aria-hidden="true" className={cn('size-2.5 rounded-full', LABEL_DOT[label])} />
            {t('add_label', { label: t(`label_${label}`) })}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * The labels of a message as small tags.
 * @param props Component props.
 * @param props.labels The labels.
 * @returns The tags, or nothing.
 */
export const LabelTags = (props: { labels: MailLabel[] }) => {
  const t = useTranslations('EmailNav');

  if (props.labels.length === 0) {
    return null;
  }

  return (
    <span className="inline-flex flex-wrap gap-1">
      {props.labels.map((label) => (
        <span
          key={label}
          className="inline-flex h-5 items-center gap-1.5 rounded-sm border border-ink-300 bg-ply px-1.5 text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-700 uppercase"
        >
          <span aria-hidden="true" className={cn('size-2 rounded-full', LABEL_DOT[label])} />
          {t(`label_${label}`)}
        </span>
      ))}
    </span>
  );
};
