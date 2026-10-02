'use client';

import { LogOutIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { signOut } from '@/actions/AuthActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * The account menu of the Vue header (`TheHeaderDropdownAccnt`): the person's photo opens a
 * menu with who is signed in and a sign-out item.
 * @param props Component props.
 * @param props.name Display name.
 * @param props.email Email address.
 * @param props.avatar Photo URL.
 * @returns The menu.
 */
export const AccountMenu = (props: { name: string; email: string; avatar: string }) => {
  const t = useTranslations('CampusAccountMenu');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('open', { name: props.name })}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Avatar size="lg">
          <AvatarImage src={props.avatar} alt="" />
          <AvatarFallback>{props.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-semibold text-ink-950">{props.name}</span>
          <span className="truncate text-xs font-normal text-ink-600">{props.email}</span>
        </DropdownMenuLabel>
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
