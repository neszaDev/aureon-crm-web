'use client';

import { MenuIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from '@/libs/I18nNavigation';

/**
 * Below 768 px, the rail and the sidebar as one drawer behind the top bar's menu button. Keyed by
 * path, so it closes on navigation.
 * @param props Component props.
 * @param props.children The rail and the sidebar.
 * @returns The menu button and its drawer.
 */
export const MobileCrmNav = (props: { children: React.ReactNode }) => {
  const t = useTranslations('CrmShell');
  const pathname = usePathname();

  return (
    <Sheet key={pathname}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('open_menu')} className="md:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        closeLabel={t('close_menu')}
        // The drawer itself takes the focus, as a dialog: its first button would open its tooltip.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (event.currentTarget instanceof HTMLElement) {
            event.currentTarget.focus();
          }
        }}
        className="w-[min(18.5rem,calc(100vw-2.5rem))] flex-row gap-0 border-none bg-sidebar p-0 outline-none"
      >
        <SheetTitle className="sr-only">{t('nav_label')}</SheetTitle>
        {props.children}
      </SheetContent>
    </Sheet>
  );
};
