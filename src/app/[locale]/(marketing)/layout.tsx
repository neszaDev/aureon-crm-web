import { setRequestLocale } from 'next-intl/server';
import { MarketingTemplate } from '@/templates/MarketingTemplate';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return <MarketingTemplate>{props.children}</MarketingTemplate>;
}
