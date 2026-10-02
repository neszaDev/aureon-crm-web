import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/PageHeader';
import { ButtonListGroup } from '@/components/showcase/base/ButtonListGroup';
import { ListGroup, ListGroupItem } from '@/components/showcase/base/ListGroup';
import { TONES } from '@/components/showcase/base/tones';
import { DemoCard } from '@/components/showcase/DemoCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SUBJECTS = ['maths', 'physics', 'chemistry', 'biology', 'history'] as const;

// Tests on file per subject, for the badges.
const TEST_COUNTS = [
  { subject: 'maths', count: 14 },
  { subject: 'physics', count: 2 },
  { subject: 'chemistry', count: 1 },
] as const;

const CUSTOM = [
  { id: 'spanish', days: 3, active: true },
  { id: 'physics', days: 5 },
  { id: 'disabled', days: 8, disabled: true },
] as const;

export default async function ListGroupsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ListGroupsPage' });
  const tTone = await getTranslations({ locale, namespace: 'BaseTones' });

  const cardText = <p className="text-ink-700">{t('card_text')}</p>;
  const cardLinks = SUBJECTS.slice(0, 3).map((subject) => (
    <ListGroupItem key={subject} href="#list-cards">
      {t(`subject_${subject}`)}
    </ListGroupItem>
  ));

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="grid items-start gap-6 md:grid-cols-2">
        <DemoCard title={t('basic_title')}>
          <ListGroup label={t('basic_title')}>
            {SUBJECTS.map((subject) => (
              <ListGroupItem key={subject}>{t(`subject_${subject}`)}</ListGroupItem>
            ))}
          </ListGroup>
        </DemoCard>

        <DemoCard title={t('active_title')}>
          <ListGroup label={t('active_title')}>
            {SUBJECTS.map((subject, index) => (
              <ListGroupItem key={subject} active={index === 1}>
                {t(`subject_${subject}`)}
              </ListGroupItem>
            ))}
          </ListGroup>
        </DemoCard>

        <DemoCard title={t('disabled_title')}>
          <ListGroup label={t('disabled_title')}>
            {SUBJECTS.map((subject, index) => (
              <ListGroupItem key={subject} disabled={index === 0 || index === 3}>
                {t(`subject_${subject}`)}
              </ListGroupItem>
            ))}
          </ListGroup>
        </DemoCard>

        <DemoCard title={t('links_title')} description={t('links_description')}>
          <ListGroup label={t('links_title')}>
            <ListGroupItem href="/dashboard/">{t('link_overview')}</ListGroupItem>
            <ListGroupItem href="/dashboard/base/list-groups/" active>
              {t('link_active')}
            </ListGroupItem>
            <ListGroupItem href="/dashboard/test-results/">{t('link_results')}</ListGroupItem>
            <ListGroupItem href="/dashboard/account/" disabled>
              {t('link_disabled')}
            </ListGroupItem>
          </ListGroup>
        </DemoCard>

        <DemoCard title={t('buttons_title')} description={t('buttons_description')}>
          <ButtonListGroup
            label={t('buttons_title')}
            items={[
              { id: 'one', label: t('button_one') },
              { id: 'two', label: t('button_two') },
              { id: 'disabled', label: t('button_disabled'), disabled: true },
              { id: 'three', label: t('button_three') },
            ]}
          />
        </DemoCard>

        <DemoCard title={t('badges_title')}>
          <ListGroup label={t('badges_title')}>
            {TEST_COUNTS.map((row) => (
              <ListGroupItem key={row.subject} className="items-center justify-between gap-3">
                {t(`subject_${row.subject}`)}
                <Badge
                  className="tabular rounded-full"
                  aria-label={t('badge_label', { count: row.count })}
                >
                  {row.count}
                </Badge>
              </ListGroupItem>
            ))}
          </ListGroup>
        </DemoCard>

        <DemoCard title={t('colors_title')} description={t('colors_description')}>
          <ListGroup label={t('colors_title')}>
            <ListGroupItem>{t('colors_default')}</ListGroupItem>
            {TONES.map((tone) => (
              <ListGroupItem key={tone} tone={tone}>
                {t('colors_item', { tone: tTone(tone) })}
              </ListGroupItem>
            ))}
          </ListGroup>
        </DemoCard>

        <DemoCard title={t('colors_links_title')} description={t('colors_links_description')}>
          <ListGroup id="list-colors-links" label={t('colors_links_title')}>
            <ListGroupItem href="#list-colors-links">{t('colors_default')}</ListGroupItem>
            {TONES.map((tone) => (
              <ListGroupItem key={tone} tone={tone} href="#list-colors-links">
                {t('colors_item', { tone: tTone(tone) })}
              </ListGroupItem>
            ))}
          </ListGroup>
        </DemoCard>
      </div>

      <DemoCard title={t('cards_title')}>
        <div id="list-cards" className="grid items-start gap-4 md:grid-cols-2">
          <Card className="gap-0 bg-paper-card">
            <CardHeader className="border-b border-ink-200 pb-4">
              <CardTitle>
                <h3>{t('card_with_list')}</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
              <ListGroup label={t('card_with_list')}>{cardLinks}</ListGroup>
              {cardText}
            </CardContent>
          </Card>
          <Card className="gap-0 bg-paper-card">
            <CardHeader className="pb-4">
              <CardTitle>
                <h3>{t('card_with_flush')}</h3>
              </CardTitle>
            </CardHeader>
            <ListGroup flush label={t('card_with_flush')}>
              {cardLinks}
            </ListGroup>
            <CardContent className="pt-4">{cardText}</CardContent>
          </Card>
        </div>
      </DemoCard>

      <DemoCard title={t('custom_title')} className="md:w-[calc(50%-0.75rem)]">
        <ListGroup id="list-custom" label={t('custom_title')}>
          {CUSTOM.map((item) => {
            const active = 'active' in item && item.active;
            const disabled = 'disabled' in item && item.disabled;
            return (
              <ListGroupItem
                key={item.id}
                href="#list-custom"
                active={active}
                disabled={disabled}
                className="flex-col gap-1"
              >
                <span className="flex w-full flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-base font-semibold">{t(`custom_${item.id}_title`)}</span>
                  <small className={active ? undefined : 'text-ink-600'}>
                    {t('days_ago', { count: item.days })}
                  </small>
                </span>
                <span>{t(`custom_${item.id}_text`)}</span>
                <small className={active ? 'text-folder-ink-soft' : 'text-ink-600'}>
                  {t(`custom_${item.id}_note`)}
                </small>
              </ListGroupItem>
            );
          })}
        </ListGroup>
      </DemoCard>
    </>
  );
}
