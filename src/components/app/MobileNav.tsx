'use client';

import { MenuIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from '@/libs/I18nNavigation';

/**
 * The sidebar as a drawer on small screens. Keyed by path, so it closes on navigation.
 * @param props Component props.
 * @param props.children The sidebar content.
 * @returns The menu button and its drawer.
 */
export const MobileNav = (props: { children: React.ReactNode }) => {
  const t = useTranslations('DashboardLayout');
  const pathname = usePathname();

  return (
    <Sheet key={pathname}>
      <SheetTrigger asChild>
        <Button variant="inverse-ghost" size="icon" aria-label={t('open_menu')}>
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        closeLabel={t('close_menu')}
        className="w-72 border-none bg-folder p-0 text-folder-ink [&>[data-slot=sheet-close]]:text-folder-ink [&>[data-slot=sheet-close]]:hover:bg-white/10"
      >
        <SheetTitle className="sr-only">{t('nav_label')}</SheetTitle>
        {props.children}
      </SheetContent>
    </Sheet>
  );
};
