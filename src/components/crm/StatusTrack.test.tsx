import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import messages from '@/locales/en.json';
import fr from '@/locales/fr.json';
import th from '@/locales/th.json';
// The segments' colours and the truncation are styles.
import '@/styles/global.css';
import { StatusTrack } from './StatusTrack';

type Props = Parameters<typeof StatusTrack>[0];

const QUALIFICATION: Props['stage'] = { id: 1, name: 'Qualification', kind: 'OPEN' };
const PROPOSAL: Props['stage'] = { id: 2, name: 'Proposal', kind: 'OPEN' };
const WON: Props['stage'] = { id: 4, name: 'Won', kind: 'WON' };
const LOST: Props['stage'] = { id: 5, name: 'Lost', kind: 'LOST' };
const STAGES = [
  QUALIFICATION,
  PROPOSAL,
  { id: 3, name: 'Negotiation', kind: 'OPEN' as const },
  WON,
  LOST,
];
const MIA = { userId: 1, email: 'mia@acme.test', displayName: 'Mia Manager' };
const RILEY = { userId: 2, email: 'riley@acme.test', displayName: 'Riley Rep' };
const NOW = new Date('2026-10-18T12:00:00Z');
// Eight whole days before NOW.
const ENTERED = '2026-10-10T09:00:00Z';

const track = (props: Partial<Props>): Props => ({
  stages: STAGES,
  stage: PROPOSAL,
  enteredAt: ENTERED,
  now: NOW,
  timeZone: 'UTC',
  ...props,
});

const renderTrack = async (props: Props, locale = 'en') =>
  await render(
    <NextIntlClientProvider
      locale={locale}
      messages={{ en: messages, fr, th }[locale]}
      timeZone="UTC"
    >
      <StatusTrack {...props} />
    </NextIntlClientProvider>,
  );

// Each segment's words, as its screen-reader text gives them.
const names = () =>
  page
    .getByRole('listitem')
    .elements()
    .map((item) => item.textContent);
const bars = () =>
  page
    .getByRole('listitem')
    .elements()
    .map((item) => getComputedStyle(item.firstElementChild ?? item).backgroundColor);

describe(StatusTrack, () => {
  it('names the track by its place, and each open stage by its state, mover and day', async () => {
    await renderTrack(
      track({ signatures: { 1: { by: MIA, at: '2026-10-06T10:00:00Z' }, 2: { by: RILEY } } }),
    );

    await expect.element(page.getByRole('list', { name: 'Stage 2 of 3: Proposal' })).toBeVisible();
    // One segment per open stage, and none for Won while the deal is open.
    expect(names()).toStrictEqual([
      'Qualification: reached, moved here by Mia Manager on Oct 6, 2026',
      'Proposal: current, 8 days, moved here by Riley Rep on Oct 10, 2026',
      'Negotiation: not reached',
    ]);
  });

  it('writes the stage and its exact days beside the track, so the colour is never alone', async () => {
    await renderTrack(track({}));

    await expect.element(page.getByText('Proposal', { exact: true })).toBeVisible();
    await expect.element(page.getByText('8d', { exact: true })).toBeVisible();
  });

  it('counts a single day in the singular', async () => {
    await renderTrack(track({ enteredAt: '2026-10-17T09:00:00Z' }));

    expect(names()[1]).toBe('Proposal: current, 1 day, entered on Oct 17, 2026');
  });

  it('fills the segments up to the current one in its stage’s colour, the rest on the hairline', async () => {
    await renderTrack(track({}));

    const [reached, current, blank] = bars();
    const tone = getComputedStyle(page.getByRole('list').element()).getPropertyValue('--tone');

    expect(reached).toBe(current);
    expect(reached).not.toBe(blank);
    expect(tone).not.toBe('');
  });

  it('says so when the member who moved the deal there has left', async () => {
    await renderTrack(track({ signatures: { 1: {} } }));

    expect(names()[0]).toBe('Qualification: reached, moved here by a former member');
  });

  it('shows the same words in a tooltip on hover', async () => {
    await renderTrack(track({ signatures: { 1: { by: MIA } } }));

    await userEvent.hover(page.getByRole('listitem').first());

    await expect
      .element(page.getByRole('tooltip'))
      .toHaveTextContent('Qualification: reached, moved here by Mia Manager');
  });

  it('fills every stage of a won deal, then its Won segment, with who won it and when', async () => {
    await renderTrack(
      track({
        stage: WON,
        signatures: { 1: { by: MIA }, 4: { by: RILEY } },
      }),
    );

    await expect.element(page.getByRole('list', { name: 'Won: closed as won' })).toBeVisible();
    expect(names()).toStrictEqual([
      'Qualification: reached, moved here by Mia Manager',
      // A stage the history never shows was still passed on the way to Won.
      'Proposal: reached',
      'Negotiation: reached',
      'Won: closed as won, moved here by Riley Rep on Oct 10, 2026',
    ]);
    expect(page.getByText('8d').elements()).toHaveLength(0);
  });

  it('fills only the stages a lost deal has a move into', async () => {
    await renderTrack(track({ stage: LOST, signatures: { 1: { by: MIA }, 5: { by: RILEY } } }));

    await expect.element(page.getByRole('list', { name: 'Lost: closed as lost' })).toBeVisible();
    expect(names()).toStrictEqual([
      'Qualification: reached, moved here by Mia Manager',
      'Proposal: no move recorded',
      'Negotiation: no move recorded',
      'Lost: closed as lost, moved here by Riley Rep on Oct 10, 2026',
    ]);
    const [reached, unknown] = bars();

    expect(reached).not.toBe(unknown);
  });

  it('writes it all out in full: each stage under its segment, who moved the deal there and when', async () => {
    await renderTrack(
      track({ full: true, signatures: { 1: {}, 2: { by: RILEY, at: '2026-10-10T09:00:00Z' } } }),
    );

    await expect.element(page.getByRole('list', { name: 'Stage 2 of 3: Proposal' })).toBeVisible();
    // Its name, the days for the current one, then who and when; the same words for assistive
    // technology after them.
    expect(names()).toStrictEqual([
      'QualificationFormer memberQualification: reached, moved here by a former member',
      'Proposal8dRiley Rep · Oct 10, 2026Proposal: current, 8 days, moved here by Riley Rep on Oct 10, 2026',
      'NegotiationNegotiation: not reached',
    ]);
    const [reached, current, blank] = bars();

    expect(reached).toBe(current);
    expect(reached).not.toBe(blank);
  });

  it('translates the words, and the dates', async () => {
    await renderTrack(track({ stage: QUALIFICATION, signatures: { 1: { by: MIA } } }), 'fr');

    await expect
      .element(page.getByRole('list', { name: 'Étape 1 sur 3 : Qualification' }))
      .toBeVisible();
    expect(names()[0]).toBe(
      'Qualification : en cours, 8 jours, déplacée ici par Mia Manager le 10 oct. 2026',
    );
  });

  it('cuts a long stage name short in a narrow card, the track keeping its room', async () => {
    const long = {
      id: 1,
      name: 'การนำเสนอและเจรจาต่อรองราคากับฝ่ายจัดซื้อขององค์กร',
      kind: 'OPEN' as const,
    };
    await render(
      <NextIntlClientProvider locale="th" messages={th} timeZone="UTC">
        <div style={{ width: 200 }}>
          <StatusTrack {...track({ stages: [long, ...STAGES.slice(1)], stage: long })} />
        </div>
      </NextIntlClientProvider>,
    );

    const list = page.getByRole('list').element();
    const row = list.parentElement;

    expect(row?.scrollWidth).toBeLessThanOrEqual(200);
    expect(list.getBoundingClientRect().width).toBeGreaterThanOrEqual(56);
  });
});
