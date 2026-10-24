import type { LocalePrefixMode } from 'next-intl/routing';

/** Locale prefix strategy for next-intl routing. */
const localePrefix: LocalePrefixMode = 'as-needed';

/** Centralized application configuration. */
export const AppConfig = {
  // A placeholder product name: replace it (and the Brand copy in src/locales) with your own.
  name: 'Aureon CRM',
  // Where the public pages send developers: this frontend's code and its API's.
  // shortcut: the CRM lives on feat/crm until it is merged; point these at the default branch then.
  sourceUrl: 'https://github.com/neszaDev/aureon-crm-web/tree/feat/crm',
  apiSourceUrl: 'https://github.com/neszaDev/aureon-crm-api/tree/feat/crm',
  i18n: {
    locales: ['en', 'fr', 'th'],
    defaultLocale: 'en',
    localePrefix,
  },
};
