'use client';

import { cn } from 'cn';
import {
  LanguagesIcon,
  LayoutTemplateIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  SunMoonIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { signOut } from '@/actions/AuthActions';
import { Seal } from '@/components/crm/Seal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePathname, useRouter } from '@/libs/I18nNavigation';
import { routing } from '@/libs/I18nRouting';
import { chooseTheme, parseTheme, themeFromCookie, THEMES } from '@/libs/Theme';

const THEME_ICONS = { light: SunIcon, dark: MoonIcon, system: MonitorIcon };

/**
 * A language's name in that language, capitalised for a menu: English, Français, ไทย.
 * @param locale The locale.
 * @returns The name.
 */
const languageName = (locale: string) => {
  const name = new Intl.DisplayNames(locale, { type: 'language' }).of(locale) ?? locale;

  return `${name.charAt(0).toLocaleUpperCase(locale)}${name.slice(1)}`;
};

/**
 * The theme choices. Rendered only while the submenu is open, so always in the browser: it reads
 * the theme cookie as the inline theme script does.
 * @returns The radio group.
 */
const ThemeChoices = () => {
  const t = useTranslations('ThemeSwitcher');
  const [chosen, setChosen] = useState(() => themeFromCookie(document.cookie));

  return (
    <DropdownMenuRadioGroup
      value={chosen}
      onValueChange={(value) => {
        const next = parseTheme(value);
        setChosen(next);
        chooseTheme(next);
      }}
    >
      {THEMES.map((item) => {
        const Icon = THEME_ICONS[item];

        return (
          <DropdownMenuRadioItem key={item} value={item}>
            <Icon aria-hidden="true" />
            {t(`theme_${item}`)}
          </DropdownMenuRadioItem>
        );
      })}
    </DropdownMenuRadioGroup>
  );
};

/**
 * Your seal, opening the account menu: who is signed in, profile, theme, language, the
 * boilerplate's demo pages and sign out.
 * @param props Component props.
 * @param props.email Email of the signed-in user.
 * @param props.displayName Their display name, if set.
 * @param props.workspaceId The open workspace, for the profile link (none outside one).
 * @param props.className Extra classes for the trigger (focus colour on the vermilion bar).
 * @returns The menu.
 */
export const AccountMenu = (props: {
  email: string;
  displayName?: string;
  workspaceId?: number;
  className?: string;
}) => {
  const t = useTranslations('AccountMenu');
  const tTheme = useTranslations('ThemeSwitcher');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('label')}
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-full transition-transform duration-150 motion-safe:active:scale-95',
          props.className,
        )}
      >
        <Seal name={props.displayName} email={props.email} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 py-2 font-normal text-foreground">
          <Seal name={props.displayName} email={props.email} size="lg" />
          <span className="flex min-w-0 flex-col">
            {props.displayName && (
              <span className="truncate font-semibold">{props.displayName}</span>
            )}
            <span className="truncate text-muted-foreground">{props.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {props.workspaceId !== undefined && (
          <DropdownMenuItem asChild>
            <Link href={`/app/${props.workspaceId}/settings/profile`}>
              <UserRoundIcon aria-hidden="true" />
              {t('profile')}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoonIcon aria-hidden="true" />
            {tTheme('label')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <ThemeChoices />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <LanguagesIcon aria-hidden="true" />
            {t('language')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={locale}
              onValueChange={(next) => {
                router.replace(`${pathname}${window.location.search}`, {
                  locale: next,
                  scroll: false,
                });
              }}
            >
              {routing.locales.map((item) => (
                <DropdownMenuRadioItem key={item} value={item} lang={item}>
                  {languageName(item)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutTemplateIcon aria-hidden="true" />
            {t('demos')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await signOut();
          }}
        >
          <LogOutIcon aria-hidden="true" />
          {t('sign_out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
