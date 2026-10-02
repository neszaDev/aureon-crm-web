'use client';

import type { LucideIcon } from 'lucide-react';
import {
  BriefcaseIcon,
  CalendarIcon,
  CameraIcon,
  MailIcon,
  MapPinIcon,
  NetworkIcon,
  SchoolIcon,
  SmartphoneIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CampusProfile } from '@/libs/api/CampusPlaceholders';

type InfoKey =
  | 'agency'
  | 'branch'
  | 'position'
  | 'mobile'
  | 'email'
  | 'gender'
  | 'birthDate'
  | 'address';

const INFO_ROWS: { key: InfoKey; icon: LucideIcon }[] = [
  { key: 'agency', icon: NetworkIcon },
  { key: 'branch', icon: SchoolIcon },
  { key: 'position', icon: BriefcaseIcon },
  { key: 'mobile', icon: SmartphoneIcon },
  { key: 'email', icon: MailIcon },
  { key: 'gender', icon: UsersIcon },
  { key: 'birthDate', icon: CalendarIcon },
  { key: 'address', icon: MapPinIcon },
];

const SOCIAL = ['facebook', 'instagram', 'google'] as const;

/**
 * The campus profile card (Vue `VPersonal`): photo with a local preview of a newly chosen
 * file, the person's details, and which social accounts are linked (greyed when missing).
 * @param props Component props.
 * @param props.profile The signed-in person's campus profile.
 * @returns The profile card.
 */
export const ProfileCard = (props: { profile: CampusProfile }) => {
  const t = useTranslations('CampusProfile');
  const [preview, setPreview] = useState<{ src: string; name: string }>();

  return (
    <Card className="gap-0">
      <CardHeader className="border-b border-ink-200 pb-4">
        <CardTitle>
          <h2 className="flex items-center gap-2">
            <UserIcon aria-hidden="true" className="size-5 text-folder" />
            {t('title')}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative size-36">
            <Image
              src={preview?.src ?? props.profile.avatar}
              alt={t('photo_alt', { name: props.profile.name })}
              width={144}
              height={144}
              unoptimized={preview !== undefined}
              className="size-36 rounded-full object-cover shadow-ply ring-4 ring-ply"
            />
            <label className="absolute right-0 bottom-0 flex size-10 cursor-pointer items-center justify-center rounded-full bg-folder text-folder-ink shadow-ply ring-4 ring-paper-card transition-colors duration-150 hover:bg-folder-deep has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
              <CameraIcon aria-hidden="true" className="size-5" />
              <span className="sr-only">{t('change_photo')}</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  const reader = new FileReader();
                  reader.addEventListener('load', () => {
                    if (typeof reader.result === 'string') {
                      setPreview({ src: reader.result, name: file.name });
                    }
                  });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <p className="text-lg font-bold text-ink-950">{props.profile.name}</p>
          <output aria-live="polite" className="min-h-4 text-center text-xs text-ink-600">
            {preview && t('photo_preview', { file: preview.name })}
          </output>
        </div>

        <dl className="flex flex-col gap-3">
          {INFO_ROWS.map((row) => (
            <div key={row.key} className="flex flex-col gap-0.5">
              <dt className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <row.icon aria-hidden="true" className="size-4 text-ink-600" />
                {t(row.key)}
              </dt>
              <dd className="pl-6 text-sm break-words text-ink-700">{props.profile[row.key]}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-3 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-700 uppercase before:h-px before:flex-1 before:bg-ink-200 after:h-px after:flex-1 after:bg-ink-200">
            {t('social_title')}
          </p>
          <ul className="flex justify-center gap-3">
            {SOCIAL.map((network) => {
              const linked = props.profile.links[network] !== null;
              const label = t(linked ? 'social_linked' : 'social_missing', {
                network: t(`network_${network}`),
              });

              return (
                <li key={network}>
                  <Image
                    src={`/assets/images/social/logo-${network}.png`}
                    alt={label}
                    title={label}
                    width={30}
                    height={30}
                    className={linked ? 'size-7.5' : 'size-7.5 opacity-60 grayscale'}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
