import { ADMIN, PASSWORD } from './helpers';
import { COMPANIES, CONTACTS, DEALS, MORE_COMPANIES, MORE_LEADS, PEOPLE, TEAMS } from './mockData';

// The e2e admin's own project: a workspace of the default team in which a team of four has been
// through the whole CRM flow, so that signing in as the admin after a run shows a lived-in CRM.
// Made once, through the API; every later run finds it and leaves it as it is.

const DAY = 24 * 60 * 60 * 1000;

/** An account signed in through the API. */
type Account = { token: string; userId: number };

/** A record as the API answers for it: enough to link it and to act on it. */
type Saved = { id: number; version: number };

type Person = { firstName: string; lastName: string };

/**
 * An instant some days from now.
 * @param days How many; negative for the past.
 * @returns The ISO-8601 instant.
 */
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString();

/**
 * A day some days from now.
 * @param days How many; negative for the past.
 * @returns The `YYYY-MM-DD` day (in UTC: a day off around midnight in Paris is fine here).
 */
const dayFromNow = (days: number) => daysFromNow(days).slice(0, 10);

/**
 * Creates the e2e admin's project, unless the admin already has a workspace of that name.
 * @param backendUrl The API's address.
 * @returns Whether it was created now.
 * @throws {Error} When the API refuses a step; the workspace may then be half made: rename it in
 *   its settings, and the next run makes a new one.
 */
export const seedAdminProject = async (backendUrl: string) => {
  const fetchApi = async (
    token: string | undefined,
    method: string,
    path: string,
    body?: unknown,
  ) =>
    await fetch(`${backendUrl}/api/v1${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token && { authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const send = async <T>(as: Account | undefined, method: string, path: string, body?: unknown) => {
    const response = await fetchApi(as?.token, method, path, body);
    if (!response.ok) {
      throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
    }
    const answer: T = await response.json();

    return answer;
  };
  const signIn = async (credentials: { email: string; password: string }) => {
    const { accessToken } = await send<{ accessToken: string }>(
      undefined,
      'POST',
      '/auth/login',
      credentials,
    );
    const me = await send<{ id: number }>({ token: accessToken, userId: 0 }, 'GET', '/users/me');

    return { token: accessToken, userId: me.id };
  };

  const owner = await signIn(ADMIN);
  const workspaces = await send<{ name: string }[]>(owner, 'GET', '/workspaces');
  if (workspaces.some((workspace) => workspace.name === TEAMS.default.name)) {
    return false;
  }

  const { id: workspaceId } = await send<Saved>(owner, 'POST', '/workspaces', {
    name: TEAMS.default.name,
    defaultCurrency: 'EUR',
    timezone: 'Europe/Paris',
  });
  const w = `/workspaces/${workspaceId}`;

  // The team: the same accounts every time (no run suffix), registered by the first run.
  const join = async (name: string, role: 'ADMIN' | 'MANAGER' | 'SALES_REP') => {
    const email = `${name.toLowerCase().replace(' ', '.')}@${TEAMS.default.domain}`;
    const registered = await fetchApi(undefined, 'POST', '/auth/register', {
      email,
      password: PASSWORD,
    });
    // 409: an earlier run registered it.
    if (registered.status !== 201 && registered.status !== 409) {
      throw new Error(`POST /auth/register ${email}: ${registered.status}`);
    }
    const member = await signIn({ email, password: PASSWORD });
    await send(member, 'PUT', '/users/me', { displayName: name });
    const { token } = await send<{ token: string }>(owner, 'POST', `${w}/invitations`, {
      email,
      role,
    });
    await send(member, 'POST', `/invitations/${token}/accept`);

    return member;
  };
  const hana = await join(PEOPLE.admin, 'ADMIN');
  const mia = await join(PEOPLE.manager, 'MANAGER');
  const riley = await join(PEOPLE.rep, 'SALES_REP');
  const ravi = await join(PEOPLE.otherRep, 'SALES_REP');

  const stages = await send<{ id: number; name: string }[]>(owner, 'GET', `${w}/pipeline-stages`);
  const stageId = (name: string) => stages.find((stage) => stage.name === name)?.id;
  const sources = await send<{ id: number; name: string }[]>(owner, 'GET', `${w}/lead-sources`);
  const sourceId = (name: string) => sources.find((source) => source.name === name)?.id;
  const create = async (as: Account, kind: string, body: Record<string, unknown>) =>
    await send<Saved>(as, 'POST', `${w}/${kind}`, body);

  // Companies, each made by the member who owns it.
  const brightwater = await create(mia, 'companies', COMPANIES.brightwater);
  const kestrel = await create(riley, 'companies', COMPANIES.kestrel);
  const solano = await create(ravi, 'companies', COMPANIES.solano);
  const fernhill = await create(riley, 'companies', COMPANIES.fernhill);
  const maple = await create(ravi, 'companies', COMPANIES.maple);
  const zephyr = await create(hana, 'companies', COMPANIES.zephyr);

  // Their people, made by the company's owner, at the company's domain.
  const contact = async (
    as: Account,
    company: { saved: Saved; website: string },
    person: Person,
    details: { jobTitle: string; tags: string[]; source: string },
  ) =>
    await create(as, 'contacts', {
      ...person,
      email:
        `${person.firstName}.${person.lastName}@${new URL(company.website).host}`.toLowerCase(),
      jobTitle: details.jobTitle,
      tags: details.tags,
      sourceId: sourceId(details.source),
      companyId: company.saved.id,
    });
  const at = {
    brightwater: { saved: brightwater, website: COMPANIES.brightwater.website },
    kestrel: { saved: kestrel, website: COMPANIES.kestrel.website },
    solano: { saved: solano, website: COMPANIES.solano.website },
    fernhill: { saved: fernhill, website: COMPANIES.fernhill.website },
    maple: { saved: maple, website: COMPANIES.maple.website },
    zephyr: { saved: zephyr, website: COMPANIES.zephyr.website },
  };
  const [
    amara,
    bruno,
    chloe,
    dmitri,
    elena,
    farah,
    gustav,
    hiro,
    ines,
    jonas,
    kavya,
    ...prospects
  ] = MORE_LEADS;
  const sofia = await contact(mia, at.brightwater, CONTACTS.buyer, {
    jobTitle: 'Procurement manager',
    tags: ['decision-maker'],
    source: 'Referral',
  });
  const warehouse = await contact(mia, at.brightwater, amara, {
    jobTitle: 'Warehouse lead',
    tags: ['operations'],
    source: 'Referral',
  });
  await contact(riley, at.kestrel, bruno, {
    jobTitle: 'Chief technology officer',
    tags: ['decision-maker', 'technical'],
    source: 'Event',
  });
  await contact(riley, at.kestrel, chloe, {
    jobTitle: 'Data engineer',
    tags: ['technical'],
    source: 'Event',
  });
  await contact(ravi, at.solano, dmitri, {
    jobTitle: 'Operations director',
    tags: ['decision-maker'],
    source: 'Outbound',
  });
  await contact(ravi, at.solano, elena, {
    jobTitle: 'Site manager',
    tags: ['operations'],
    source: 'Outbound',
  });
  await contact(riley, at.fernhill, farah, {
    jobTitle: 'Store manager',
    tags: ['decision-maker'],
    source: 'Website',
  });
  await contact(riley, at.fernhill, gustav, {
    jobTitle: 'Buyer',
    tags: ['budget-holder'],
    source: 'Website',
  });
  const mapleOwner = await contact(ravi, at.maple, hiro, {
    jobTitle: 'Owner',
    tags: ['decision-maker', 'vip'],
    source: 'Partner',
  });
  await contact(ravi, at.maple, ines, {
    jobTitle: 'Finance manager',
    tags: ['budget-holder'],
    source: 'Partner',
  });
  const fleet = await contact(hana, at.zephyr, jonas, {
    jobTitle: 'Fleet manager',
    tags: ['newsletter', 'operations'],
    source: 'Other',
  });
  await contact(hana, at.zephyr, kavya, {
    jobTitle: 'Dispatcher',
    tags: ['newsletter'],
    source: 'Other',
  });

  // Leads in every status, with their sources, priorities and follow-up dates.
  const lead = async (as: Account, person: Person, values: Record<string, unknown>) =>
    await create(as, 'leads', { ...person, ...values });
  const status = async (as: Account, saved: Saved, to: string, reason?: string) =>
    await send<Saved>(as, 'POST', `${w}/leads/${saved.id}/status`, {
      status: to,
      reason,
      version: saved.version,
    });
  const [liam, mei, nikolai, olga, pedro, quinn, rosa, samir, thandi] = prospects;
  await lead(riley, mei, {
    companyName: MORE_COMPANIES[21],
    sourceId: sourceId('Website'),
    priority: 'HIGH',
    followUpDate: dayFromNow(-1),
  });
  await lead(ravi, nikolai, {
    companyName: MORE_COMPANIES[22],
    sourceId: sourceId('Event'),
    followUpDate: dayFromNow(3),
  });
  await lead(riley, samir, { companyName: MORE_COMPANIES[20], sourceId: sourceId('Website') });
  await lead(hana, liam, { companyName: MORE_COMPANIES[23], sourceId: sourceId('Event') });
  const olgaLead = await lead(ravi, olga, {
    companyName: MORE_COMPANIES[13],
    sourceId: sourceId('Outbound'),
    followUpDate: dayFromNow(0),
  });
  await status(ravi, olgaLead, 'CONTACTED');
  const pedroLead = await lead(mia, pedro, {
    companyName: MORE_COMPANIES[15],
    sourceId: sourceId('Partner'),
    priority: 'LOW',
    followUpDate: dayFromNow(7),
  });
  await status(mia, pedroLead, 'CONTACTED');
  const thandiLead = await lead(ravi, thandi, {
    companyName: MORE_COMPANIES[0],
    sourceId: sourceId('Referral'),
    priority: 'HIGH',
    followUpDate: dayFromNow(-2),
  });
  await status(ravi, thandiLead, 'CONTACTED');
  const quinnLead = await lead(riley, quinn, {
    companyName: MORE_COMPANIES[1],
    sourceId: sourceId('Referral'),
    priority: 'HIGH',
    followUpDate: dayFromNow(2),
    estimatedValue: '7500.00',
  });
  await status(riley, await status(riley, quinnLead, 'CONTACTED'), 'QUALIFIED');
  const rosaLead = await lead(riley, rosa, {
    companyName: MORE_COMPANIES[8],
    sourceId: sourceId('Other'),
    priority: 'LOW',
  });
  await status(riley, rosaLead, 'UNQUALIFIED', 'No budget until next year');
  // One qualified and converted: a new company, its contact and a deal.
  const okafor = await lead(riley, CONTACTS.lead, {
    companyName: MORE_COMPANIES[3],
    sourceId: sourceId('Website'),
    estimatedValue: '4500.00',
  });
  await status(riley, await status(riley, okafor, 'CONTACTED'), 'QUALIFIED');
  const conversion = await send<{ deal: { id: number } }>(
    riley,
    'POST',
    `${w}/leads/${okafor.id}/convert`,
    { createCompany: true, deal: { name: `${MORE_COMPANIES[3]} scanners`, amount: '4500.00' } },
  );

  // Deals in two currencies, each moved stage by stage by its owner, so the history and the
  // tracks say who moved them; one won, one lost with its reason.
  const moveThrough = async (as: Account, saved: Saved, names: string[], lostReason?: string) => {
    let current = saved;
    for (const name of names) {
      // oxlint-disable-next-line no-await-in-loop -- one stage after the other
      current = await send<Saved>(as, 'POST', `${w}/deals/${saved.id}/move`, {
        stageId: stageId(name),
        version: current.version,
        lostReason: name === 'Lost' ? lostReason : undefined,
      });
    }
  };
  const tablets = await create(mia, 'deals', {
    name: DEALS.tablets,
    amount: '18500.00',
    companyId: brightwater.id,
    contactId: sofia.id,
    expectedCloseDate: dayFromNow(21),
  });
  await moveThrough(mia, tablets, ['Needs analysis', 'Proposal']);
  const rollout = await create(mia, 'deals', {
    name: DEALS.rollout,
    amount: '42000.00',
    companyId: brightwater.id,
    contactId: warehouse.id,
    expectedCloseDate: dayFromNow(10),
  });
  await moveThrough(mia, rollout, ['Needs analysis', 'Proposal', 'Negotiation']);
  const usExpansion = await create(riley, 'deals', {
    name: DEALS.usExpansion,
    amount: '26000.00',
    currency: 'USD',
    companyId: brightwater.id,
    expectedCloseDate: dayFromNow(45),
  });
  await moveThrough(riley, usExpansion, ['Needs analysis']);
  await create(mia, 'deals', { name: DEALS.renewal, amount: '6400.00', companyId: brightwater.id });
  const retrofit = await create(ravi, 'deals', {
    name: DEALS.retrofit,
    amount: '31250.00',
    companyId: solano.id,
    sourceId: sourceId('Outbound'),
  });
  await moveThrough(ravi, retrofit, ['Needs analysis']);
  await create(riley, 'deals', {
    name: DEALS.starterKit,
    amount: '2800.00',
    companyId: fernhill.id,
    sourceId: sourceId('Website'),
  });
  const won = await create(ravi, 'deals', {
    name: DEALS.won,
    amount: '12750.00',
    currency: 'USD',
    companyId: maple.id,
    contactId: mapleOwner.id,
    sourceId: sourceId('Partner'),
  });
  await moveThrough(ravi, won, ['Needs analysis', 'Proposal', 'Negotiation', 'Won']);
  const lost = await create(riley, 'deals', {
    name: DEALS.lost,
    amount: '9900.00',
    companyId: fernhill.id,
  });
  await moveThrough(riley, lost, ['Needs analysis', 'Proposal', 'Lost'], 'Chose a local supplier');

  // Tasks: upcoming, due soon, overdue, completed and cancelled, for different members.
  const task = async (as: Account, values: Record<string, unknown>) =>
    await create(as, 'tasks', values);
  const finish = async (as: Account, saved: Saved, action: 'complete' | 'cancel') =>
    await send(as, 'POST', `${w}/tasks/${saved.id}/${action}`, { version: saved.version });
  await task(mia, {
    title: 'Send the revised proposal',
    dueAt: daysFromNow(1),
    priority: 'HIGH',
    dealId: tablets.id,
  });
  await task(mia, {
    title: `Call ${CONTACTS.buyer.firstName} about delivery slots`,
    dueAt: daysFromNow(-2),
    contactId: sofia.id,
  });
  // The manager hands one to a rep.
  await task(mia, {
    title: `Follow up with ${quinn.firstName} ${quinn.lastName}`,
    dueAt: daysFromNow(0.2),
    assigneeId: riley.userId,
    leadId: quinnLead.id,
  });
  await task(riley, {
    title: 'Check the renewal terms',
    dueAt: daysFromNow(-1),
    priority: 'LOW',
    companyId: kestrel.id,
  });
  await task(ravi, { title: 'Book a site visit', dueAt: daysFromNow(3), dealId: retrofit.id });
  const chase = await task(ravi, {
    title: 'Chase the signed order',
    dueAt: daysFromNow(-3),
    dealId: won.id,
  });
  await finish(ravi, chase, 'complete');
  const quote = await task(riley, {
    title: 'Prepare the cold room quote',
    dueAt: daysFromNow(-4),
    dealId: lost.id,
  });
  await finish(riley, quote, 'cancel');
  await task(hana, {
    title: 'Plan the quarterly review',
    dueAt: daysFromNow(7),
    companyId: zephyr.id,
  });
  await task(owner, {
    title: 'Review the pipeline with the team',
    dueAt: daysFromNow(-1),
    priority: 'HIGH',
  });

  // Activities of every type, on the records they are about, over the last two weeks.
  const activities = [
    [mia, 'CALL', 'Intro call', { contactId: sofia.id }, -12],
    [ravi, 'EMAIL', 'Quote sent', { dealId: won.id }, -8],
    [mia, 'EMAIL', 'Sent the price list', { dealId: tablets.id }, -7],
    [mia, 'MEETING', 'Depot walk-through', { dealId: rollout.id }, -6],
    [mia, 'NOTE', 'Deliveries before 9 am only', { companyId: brightwater.id }, -5],
    [riley, 'CALL', 'Discovery call', { leadId: quinnLead.id }, -3],
    [riley, 'NOTE', 'Budget frozen until next year', { leadId: rosaLead.id }, -2],
    [ravi, 'CALL', 'Kick-off call', { dealId: retrofit.id }, -2],
    [ravi, 'MEETING', 'Signed at the store', { dealId: won.id }, -1],
    [hana, 'EMAIL', 'Welcome pack sent', { contactId: fleet.id }, -1],
    [riley, 'MEETING', 'Handover meeting', { dealId: conversion.deal.id }, -0.5],
  ] as const;
  for (const [as, type, subject, link, days] of activities) {
    // oxlint-disable-next-line no-await-in-loop -- one after the other, as people would
    await create(as, 'activities', { type, subject, occurredAt: daysFromNow(days), ...link });
  }

  return true;
};
