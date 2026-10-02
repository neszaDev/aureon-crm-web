import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Kalam, Libre_Franklin } from 'next/font/google';
import { notFound } from 'next/navigation';
import { routing } from '@/libs/I18nRouting';
import '@/styles/global.css';

// The printed form face and the handwritten remark face. Self-hosted by next/font at build.
const franklin = Libre_Franklin({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-franklin',
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
  themeColor: '#1f5c45',
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

  return (
    <html lang={locale} className={`${franklin.variable} ${kalam.variable}`}>
      <body>
        <NextIntlClientProvider>{props.children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
