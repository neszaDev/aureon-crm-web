import { cn } from 'cn';
import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Anuphan, Kalam } from 'next/font/google';
import { notFound } from 'next/navigation';
import { ThemeClass } from '@/components/ThemeClass';
import { routing } from '@/libs/I18nRouting';
import { THEME_SCRIPT } from '@/libs/Theme';
import { getBaseUrl } from '@/utils/Helpers';
import '@/styles/global.css';

// Anuphan sets Latin and Thai alike; Kalam is the demo pages' handwritten remarks only.
// Both are self-hosted by next/font at build.
const anuphan = Anuphan({
  // The subsets preloaded on every page; latin-ext (œ and rarer letters) still loads when a page
  // draws one of its letters.
  subsets: ['latin', 'thai'],
  variable: '--font-anuphan',
  display: 'swap',
});

const kalam = Kalam({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-kalam',
  display: 'swap',
  // Only the demo pages draw with it: loaded when used, never preloaded on every page.
  preload: false,
});

export const metadata: Metadata = {
  // Makes the Open Graph image's URL absolute. A Docker build runs without APP_URL (validation
  // skipped), hence the fallback.
  metadataBase: new URL(getBaseUrl() || 'http://localhost:3000'),
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The ground of each theme (`--ground`).
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eff0ec' },
    { media: '(prefers-color-scheme: dark)', color: '#141212' },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  // The public pages' client components translate only these: their HTML stays light. Each
  // signed-in area's layout gives its own provider every message.
  const { ErrorPage, LocaleSwitcher } = await getMessages();

  // The theme class comes from the cookie in the browser (THEME_SCRIPT, before the first paint),
  // so pages stay static; the server renders none, hence suppressHydrationWarning.
  return (
    <html lang={locale} className={cn(anuphan.variable, kalam.variable)} suppressHydrationWarning>
      <head>
        <script
          // A constant script with no user input; Theme.test.ts proves it applies only light|dark.
          // oxlint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
      </head>
      <body>
        <ThemeClass />
        <NextIntlClientProvider messages={{ ErrorPage, LocaleSwitcher }}>
          {props.children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
