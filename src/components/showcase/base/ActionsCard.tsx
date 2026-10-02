'use client';

import { cn } from 'cn';
import { ChevronDownIcon, ChevronUpIcon, RotateCcwIcon, SettingsIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Link } from '@/libs/I18nNavigation';

/**
 * A card with header actions: a settings link, a button that folds the body away and one that
 * closes the card. A closed card leaves a button to bring it back.
 * @param props Component props.
 * @param props.className Extra classes for the card (its fill).
 * @param props.children The card body.
 * @returns The card, or the button that restores it.
 */
export const ActionsCard = (props: { className?: string; children: React.ReactNode }) => {
  const t = useTranslations('CardsPage');
  const [open, setOpen] = useState(true);
  const [shown, setShown] = useState(true);
  const bodyId = useId();

  if (!shown) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-sm border border-dashed border-ink-300">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShown(true);
          }}
        >
          <RotateCcwIcon data-icon="inline-start" />
          {t('actions_restore')}
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn('animate-in gap-0 duration-200 fade-in-0', props.className)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className={cn(open && 'border-b border-ink-300 pb-4')}>
          <CardTitle>
            <h3>{t('actions_title')}</h3>
          </CardTitle>
          <CardAction className="flex gap-0.5">
            <Button asChild variant="ghost" size="icon-sm" aria-label={t('actions_settings')}>
              <Link href="/dashboard/account/">
                <SettingsIcon />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={open ? t('actions_minimize') : t('actions_expand')}
              onClick={() => {
                setOpen(!open);
              }}
            >
              {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('actions_close')}
              onClick={() => {
                setShown(false);
              }}
            >
              <XIcon />
            </Button>
          </CardAction>
        </CardHeader>
        <CollapsibleContent
          id={bodyId}
          className="overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up"
        >
          <CardContent className="pt-4">{props.children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
