import { ChevronDownIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { DemoCard } from '@/components/showcase/DemoCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// The open/close motion of every collapsible on the page.
const SLIDE =
  'overflow-hidden data-closed:animate-collapsible-up data-open:animate-collapsible-down';

const ACCORDION_ITEMS = ['marks', 'remarks', 'retakes'] as const;

export default async function CollapsesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CollapsesPage' });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-6 md:grid-cols-2">
        <DemoCard title={t('collapse_title')} description={t('collapse_description')}>
          <Collapsible className="flex flex-col gap-3">
            <CollapsibleTrigger asChild>
              <Button className="self-start">{t('toggle')}</Button>
            </CollapsibleTrigger>
            <CollapsibleContent className={SLIDE}>
              <div className="flex flex-col gap-3 rounded-sm border border-ink-200 bg-ply p-4">
                <p className="text-ink-700">{t('contents')}</p>
                <Collapsible className="flex flex-col gap-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="secondary" size="sm" className="self-start">
                      {t('toggle_inner')}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className={SLIDE}>
                    <p className="rounded-sm border border-ink-200 bg-paper-card p-3 text-ink-700">
                      {t('inner_contents')}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </DemoCard>

        <Card className="gap-0 py-0">
          <Collapsible defaultOpen>
            <CardHeader className="px-0">
              <h2>
                <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between gap-3 px-5 py-5 text-left font-heading text-lg leading-snug font-semibold tracking-[-0.01em] text-ink-950 outline-none hover:bg-ink-100/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                  {t('card_title')}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-ink-600 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180"
                  />
                </CollapsibleTrigger>
              </h2>
            </CardHeader>
            <CollapsibleContent className={SLIDE}>
              <CardContent className="border-t border-ink-200 py-5 text-ink-700">
                {t('card_text')}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      <DemoCard title={t('accordion_title')} description={t('accordion_description')}>
        <Accordion type="single" collapsible defaultValue="marks">
          {ACCORDION_ITEMS.map((item) => (
            <AccordionItem key={item} value={item} className="border-ink-200">
              <AccordionTrigger className="text-[0.9375rem] font-semibold text-ink-950">
                {t(`accordion_${item}_title`)}
              </AccordionTrigger>
              <AccordionContent className="text-ink-700">
                {t(`accordion_${item}_text`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DemoCard>
    </>
  );
}
