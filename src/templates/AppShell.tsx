import { useTranslations } from 'next-intl';
import { AppNav } from '@/components/app/AppNav';
import { MobileNav } from '@/components/app/MobileNav';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { SignOutButton } from '@/components/SignOutButton';
import { Wordmark } from '@/components/Wordmark';

/**
 * The folder-green sidebar: wordmark, sections, and who is signed in.
 * @param props Component props.
 * @param props.email Email of the signed-in user.
 * @returns The sidebar content.
 */
const SidebarContent = (props: { email?: string }) => {
  const t = useTranslations('DashboardLayout');

  return (
    <div className="flex h-full flex-col gap-8 p-4 pt-5">
      <Wordmark tone="folder" href="/dashboard/" className="px-3" />
      <AppNav />
      <div className="mt-auto flex flex-col gap-3 border-t border-white/12 px-1 pt-4">
        <div className="flex min-w-0 flex-col gap-0.5 px-2">
          <span className="text-xs text-folder-ink-soft">{t('signed_in_as')}</span>
          <span className="truncate text-sm font-semibold text-folder-ink" title={props.email}>
            {props.email}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <SignOutButton />
          <LocaleSwitcher tone="folder" />
        </div>
      </div>
    </div>
  );
};

/**
 * The signed-in app: sidebar on large screens, a drawer behind a menu button below that.
 * @param props Component props.
 * @param props.email Email of the signed-in user.
 * @param props.children Page content.
 * @returns The app layout.
 */
export const AppShell = (props: { email?: string; children: React.ReactNode }) => (
  <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
    <aside className="hidden bg-folder text-folder-ink lg:block">
      <div className="sticky top-0 h-dvh">
        <SidebarContent email={props.email} />
      </div>
    </aside>

    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-folder px-2 text-folder-ink lg:hidden">
      <MobileNav>
        <SidebarContent email={props.email} />
      </MobileNav>
      <Wordmark tone="folder" href="/dashboard/" />
    </header>

    <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">{props.children}</div>
    </main>
  </div>
);
