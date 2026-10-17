import { cn } from 'cn';
import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Anuphan, Kalam } from 'next/font/google';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { routing } from '@/libs/I18nRouting';
import { parseTheme, THEME_COOKIE } from '@/libs/Theme';
import '@/styles/global.css';

// Anuphan sets Latin and Thai alike; Kalam is the demo pages' handwritten remarks only.
// Both are self-hosted by next/font at build.
const anuphan = Anuphan({
  subsets: ['latin', 'latin-ext', 'thai'],
  variable: '--font-anuphan',
  display: 'swap',
});

const kalam = Kalam({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-kalam',
  display: 'swap',
});

export const metadata: Metadata = {
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
  // Set on the server so the first paint already has the theme; `system` leaves it to the OS.
  const jar = await cookies();
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);

  return (
    <html
      lang={locale}
      className={cn(anuphan.variable, kalam.variable, theme !== 'system' && theme)}
    >
      <body>
        <NextIntlClientProvider>{props.children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
