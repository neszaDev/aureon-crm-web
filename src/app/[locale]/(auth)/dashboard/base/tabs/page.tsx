import { CalculatorIcon, ChartPieIcon, ShoppingCartIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TEXT_TABS = ['home', 'profile', 'disabled'] as const;

const ICON_TABS = [
  { id: 'calculator', icon: CalculatorIcon },
  { id: 'cart', icon: ShoppingCartIcon },
  { id: 'charts', icon: ChartPieIcon },
] as const;

const PANEL = 'pt-3 text-[0.9375rem] leading-relaxed text-ink-700';

export default async function TabsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TabsPage' });

  const textTabs = (variant: 'default' | 'line') => (
    <Tabs defaultValue="home">
      <TabsList variant={variant} aria-label={t('text_label')}>
        {TEXT_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} disabled={tab === 'disabled'} className="px-3">
            {t(`tab_${tab}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      {TEXT_TABS.map((tab) => (
        <TabsContent key={tab} value={tab} className={PANEL}>
          {t(`panel_${tab}`)}
        </TabsContent>
      ))}
    </Tabs>
  );

  const iconPanels = ICON_TABS.map((tab) => (
    <TabsContent key={tab.id} value={tab.id} className={PANEL}>
      {t(`panel_${tab.id}`)}
    </TabsContent>
  ));

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <DemoCard title={t('tabs_title')} description={t('tabs_description')}>
          {textTabs('line')}
        </DemoCard>

        <DemoCard title={t('pills_title')} description={t('pills_description')}>
          {textTabs('default')}
        </DemoCard>

        <DemoCard title={t('icons_title')}>
          <Tabs defaultValue="cart">
            <TabsList variant="line" aria-label={t('icons_label')}>
              {ICON_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  aria-label={t(`tab_${tab.id}`)}
                  className="px-3"
                >
                  <tab.icon aria-hidden="true" />
                </TabsTrigger>
              ))}
            </TabsList>
            {iconPanels}
          </Tabs>
        </DemoCard>

        <DemoCard title={t('icons_text_title')}>
          <Tabs defaultValue="cart">
            <TabsList
              variant="line"
              aria-label={t('icons_label')}
              className="max-w-full overflow-x-auto"
            >
              {ICON_TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="px-3">
                  <tab.icon data-icon="inline-start" aria-hidden="true" />
                  {t(`tab_${tab.id}`)}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="mt-1">{iconPanels}</div>
          </Tabs>
        </DemoCard>

        <DemoCard title={t('vertical_title')} description={t('vertical_description')}>
          <Tabs defaultValue="calculator" orientation="vertical" className="gap-4 max-sm:flex-col">
            <TabsList
              aria-label={t('icons_label')}
              className="shrink-0 items-stretch max-sm:w-full"
            >
              {ICON_TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="h-9 px-3">
                  <tab.icon data-icon="inline-start" aria-hidden="true" />
                  {t(`tab_${tab.id}`)}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="min-w-0 flex-1 [&>[data-slot=tabs-content]]:pt-0">{iconPanels}</div>
          </Tabs>
        </DemoCard>
      </div>
    </>
  );
}
