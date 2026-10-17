import type { LocalePrefixMode } from 'next-intl/routing';

/** Locale prefix strategy for next-intl routing. */
const localePrefix: LocalePrefixMode = 'as-needed';

/** Centralized application configuration. */
export const AppConfig = {
  // A placeholder product name: replace it (and the Brand copy in src/locales) with your own.
  name: 'Aureon CRM',
  i18n: {
    locales: ['en', 'fr', 'th'],
    defaultLocale: 'en',
    localePrefix,
  },
};
