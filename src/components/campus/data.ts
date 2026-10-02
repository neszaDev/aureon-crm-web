import type { LucideIcon } from 'lucide-react';
import { BriefcaseIcon, GaugeIcon, PaintbrushIcon, SmartphoneIcon, TicketIcon } from 'lucide-react';

/** An app tile of the launcher; `name` picks its `CampusLauncher.app_*` label. */
type LauncherApp = { id: string; name: 'application'; badge: number; icon: LucideIcon };

/** A launcher category; `name` picks its `CampusLauncher.category_*` label. */
export type LauncherCategory = {
  id: string;
  name: 'events' | 'services' | 'application' | 'business_intelligence';
  icon: LucideIcon;
  apps: LauncherApp[];
};

// The Vue dashboard's sample launcher (src/projects/views/dashboards/index.vue).
export const launcherCategories: LauncherCategory[] = [
  {
    id: '1',
    name: 'events',
    icon: TicketIcon,
    apps: [{ id: '1-1', name: 'application', badge: 0, icon: GaugeIcon }],
  },
  {
    id: '2',
    name: 'services',
    icon: PaintbrushIcon,
    apps: [{ id: '2-1', name: 'application', badge: 100, icon: GaugeIcon }],
  },
  {
    id: '3',
    name: 'application',
    icon: SmartphoneIcon,
    apps: [{ id: '3-1', name: 'application', badge: 100, icon: GaugeIcon }],
  },
  {
    id: '4',
    name: 'business_intelligence',
    icon: BriefcaseIcon,
    apps: [{ id: '4-1', name: 'application', badge: 100, icon: GaugeIcon }],
  },
];

// Contacts and documents of the sign-in help dialog (Vue `SignIn.vue`).
export const signInHelp = {
  phone: '0-5391-6494, 6053',
  email: 'personnel@mfu.ac.th',
  competencyThai:
    'https://drive.google.com/file/d/1obIc3c5kEJ6nP1rBH5uA9nvw62fjzTid/view?usp=sharing',
  competencyEnglish:
    'https://drive.google.com/file/d/1Ds3wv_QlPoA_M10i2snrzrh5Ri_Qi9wQ/view?usp=sharing',
  manualThai: 'https://drive.google.com/file/d/1YJxsIbrhgp9tsfz-neHuEDC39mgUpWqg/view?usp=sharing',
  manualEnglish:
    'https://drive.google.com/file/d/1dGYb9s9X1WVuPwEWW3xaScCUEsODxwkA/view?usp=sharing',
  issueForm:
    'https://docs.google.com/forms/d/e/1FAIpQLSec2LSaDE1flmQULhl7bsCbTOZl4nd1VGfSv3LDxP7bnuZ9iQ/viewform',
};

/** What the QR code card starts with (Vue `QRCodes.vue` defaults, with a real address). */
export const qrDefaults = { text: 'https://www.mfu.ac.th', label: 'MFU' };

export const MFU_LOGO = '/assets/images/mfu-logo.svg';
