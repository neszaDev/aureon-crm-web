'use client';

import { ChevronDownIcon, ChevronUpIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

/**
 * A demo card whose header can collapse its body and close the card. A closed card leaves a
 * ruled note with a button to bring it back.
 * @param props Component props.
 * @param props.title Card title.
 * @param props.icon Icon shown before the title.
 * @param props.children The card body.
 * @returns The card, or the note that it was closed.
 */
export const ClosableCard = (props: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const t = useTranslations('BasicFormsPage');
  const [open, setOpen] = useState(true);
  const [shown, setShown] = useState(true);

  if (!shown) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-dashed border-ink-300 px-5 py-4 text-[0.9375rem] text-ink-600">
        <p>{t('card_closed', { title: props.title })}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShown(true);
          }}
        >
          {t('show_card')}
        </Button>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <DemoCard
        title={
          <span className="flex items-center gap-2">
            {props.icon}
            {props.title}
          </span>
        }
        contentClassName={open ? undefined : 'hidden'}
        action={
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={open ? t('collapse_card') : t('expand_card')}
              >
                {open ? (
                  <ChevronUpIcon aria-hidden="true" />
                ) : (
                  <ChevronDownIcon aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('close_card')}
              onClick={() => {
                setShown(false);
              }}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
        }
      >
        <CollapsibleContent>{props.children}</CollapsibleContent>
      </DemoCard>
    </Collapsible>
  );
};
