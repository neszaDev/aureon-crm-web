'use client';

import { MenuIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from '@/libs/I18nNavigation';

/**
 * The rail as a drawer below `lg`. Keyed by path, so it closes on navigation.
 * @param props Component props.
 * @param props.children The rail content.
 * @returns The menu button and its drawer.
 */
export const MobileCrmNav = (props: { children: React.ReactNode }) => {
  const t = useTranslations('CrmShell');
  const pathname = usePathname();

  return (
    <Sheet key={pathname}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('open_menu')}
          className="text-on-seal hover:bg-rail-raised hover:text-white focus-visible:ring-on-seal focus-visible:ring-offset-seal aria-expanded:bg-rail-raised"
        >
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        closeLabel={t('close_menu')}
        className="w-72 border-none bg-seal p-0 pt-10 text-on-seal [&>[data-slot=sheet-close]]:text-on-seal [&>[data-slot=sheet-close]]:hover:bg-rail-raised [&>[data-slot=sheet-close]]:focus-visible:ring-on-seal [&>[data-slot=sheet-close]]:focus-visible:ring-offset-seal"
      >
        <SheetTitle className="sr-only">{t('nav_label')}</SheetTitle>
        {props.children}
      </SheetContent>
    </Sheet>
  );
};
