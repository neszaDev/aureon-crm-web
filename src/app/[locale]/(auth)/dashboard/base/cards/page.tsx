import { cn } from 'cn';
import { CheckIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { ActionsCard } from '@/components/showcase/base/ActionsCard';
import type { Tone } from '@/components/showcase/base/tones';
import { toneAccent, toneBorder, toneSolid } from '@/components/showcase/base/tones';
import { ToneSwitch } from '@/components/showcase/base/ToneSwitch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Bootstrap's six card colours, with red pen left out: it only ever marks errors.
const RULED: Tone[] = ['folder', 'ink', 'pass', 'deep', 'pencil', 'dark'];
const QUOTED: Tone[] = ['folder', 'pass', 'deep', 'pencil', 'dark', 'light'];
const FILLED: Tone[] = ['folder', 'pass', 'deep', 'pencil', 'dark'];

/**
 * One group of example cards under its own heading.
 * @param props Component props.
 * @param props.id Heading id.
 * @param props.title Heading text.
 * @param props.children The cards.
 * @returns The section.
 */
const Section = (props: { id: string; title: string; children: React.ReactNode }) => (
  <section aria-labelledby={props.id} className="flex flex-col gap-4">
    <h2 id={props.id} className="text-lg font-bold tracking-[-0.01em] text-ink-950">
      {props.title}
    </h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{props.children}</div>
  </section>
);

/**
 * A card with a ruled header band and a body.
 * @param props Component props.
 * @param props.title Header text.
 * @param props.action Content on the right of the header.
 * @param props.className Extra classes for the card.
 * @param props.headerClassName Extra classes for the header band.
 * @param props.children The body.
 * @returns The card.
 */
const HeaderCard = (props: {
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
}) => (
  <Card className={cn('gap-0', props.className)}>
    <CardHeader className={cn('border-b border-ink-200 pb-4', props.headerClassName)}>
      <CardTitle>
        <h3 className="flex items-center gap-2">{props.title}</h3>
      </CardTitle>
      {props.action && <CardAction>{props.action}</CardAction>}
    </CardHeader>
    <CardContent className="pt-4 text-ink-700">{props.children}</CardContent>
  </Card>
);

export default async function CardsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CardsPage' });
  const tTone = await getTranslations({ locale, namespace: 'BaseTones' });

  const body = t('body');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section id="cards-parts" title={t('parts_title')}>
        <HeaderCard title={t('card_title')}>{body}</HeaderCard>
        <Card className="gap-0">
          <CardContent className="pb-5 text-ink-700">{body}</CardContent>
          <CardFooter className="border-t border-ink-200 py-3 text-ink-600">
            {t('card_footer')}
          </CardFooter>
        </Card>
        <HeaderCard
          title={
            <>
              <CheckIcon aria-hidden="true" className="size-4 text-pass" />
              {t('card_icon')}
            </>
          }
        >
          {body}
        </HeaderCard>
        <HeaderCard
          title={t('card_switch')}
          action={
            <ToneSwitch
              tone="deep"
              size="sm"
              shape="pill"
              defaultChecked
              labelOn={t('switch_on')}
              labelOff={t('switch_off')}
              label={t('card_switch')}
            />
          }
        >
          {body}
        </HeaderCard>
        <HeaderCard
          title={t('card_label')}
          action={<Badge className={toneSolid.pass}>{t('label_success')}</Badge>}
        >
          {body}
        </HeaderCard>
        <HeaderCard
          title={t('card_label')}
          action={
            <Badge variant="destructive" className="tabular rounded-full">
              42
            </Badge>
          }
        >
          {body}
        </HeaderCard>
      </Section>

      <Section id="cards-outline" title={t('outline_section')}>
        {RULED.map((tone) => (
          <HeaderCard
            key={tone}
            title={t('outline_title', { tone: tTone(tone) })}
            className={toneBorder[tone]}
            headerClassName={toneBorder[tone]}
          >
            {body}
          </HeaderCard>
        ))}
      </Section>

      <Section id="cards-accent" title={t('accent_section')}>
        {RULED.map((tone) => (
          <HeaderCard
            key={tone}
            title={t('accent_title', { tone: tTone(tone) })}
            className={cn('border-t-[3px]', toneAccent[tone])}
          >
            {body}
          </HeaderCard>
        ))}
      </Section>

      <Section id="cards-quote" title={t('quote_section')}>
        {QUOTED.map((tone) => (
          <Card key={tone} className={cn('border-transparent text-center', toneSolid[tone])}>
            <CardContent>
              <figure className="flex flex-col gap-3">
                <blockquote className="text-base leading-relaxed">
                  <p>{t('quote_text')}</p>
                </blockquote>
                <figcaption className="text-sm opacity-85">
                  {t.rich('quote_source', { cite: (chunks) => <cite>{chunks}</cite> })}
                </figcaption>
              </figure>
            </CardContent>
          </Card>
        ))}
      </Section>

      <Section id="cards-filled" title={t('filled_section')}>
        {FILLED.map((tone) => (
          <Card key={tone} className={cn('border-transparent', toneSolid[tone])}>
            <CardContent>
              <p>{body}</p>
            </CardContent>
          </Card>
        ))}
        <ActionsCard className={cn('border-transparent', toneSolid.light)}>
          <p>{body}</p>
        </ActionsCard>
      </Section>
    </>
  );
}
