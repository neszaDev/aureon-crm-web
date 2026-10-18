import { refresh } from 'next/cache';
import { describe, expect, it, vi } from 'vitest';
import { actionFailure } from '@/libs/api/ActionFailure';
import { authedBackend } from '@/libs/api/Backend';
import { redirect } from '@/libs/I18nNavigation';
import type { LeadValues } from '@/validations/crm/LeadValidation';
import { changeLeadStatus, convertLead, createLead, updateLead } from './LeadActions';

vi.mock(import('server-only'), () => ({}));
// @ts-expect-error -- a translator that gives the key back
vi.mock(import('next-intl/server'), () => ({
  getTranslations: async () => await Promise.resolve((key: string) => key),
  getLocale: async () => await Promise.resolve('en'),
}));
vi.mock(import('next/cache'), () => ({ refresh: vi.fn<() => void>() }));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
vi.mock(import('@/libs/api/ActionFailure'), () => ({
  actionFailure: vi.fn<typeof actionFailure>(),
}));
vi.mock(import('@/libs/I18nNavigation'), () => ({ redirect: vi.fn<typeof redirect>() }));

const VALUES: LeadValues = {
  firstName: 'Mia',
  lastName: '',
  companyName: ' Acme ',
  email: '',
  phone: '',
  jobTitle: '',
  sourceId: null,
  ownerId: null,
  priority: 'HIGH',
  followUpDate: '',
  estimatedValue: '',
  currency: '',
  notes: '',
};

type Call = (path: string, init: unknown) => Promise<unknown>;

const backend = (status: number, data?: unknown) => {
  const POST = vi.fn<Call>().mockResolvedValue({ data, response: new Response(null, { status }) });
  const PUT = vi.fn<Call>().mockResolvedValue({ data, response: new Response(null, { status }) });
  // @ts-expect-error -- only the calls these actions make
  vi.mocked(authedBackend).mockResolvedValue({ POST, PUT });

  return { POST, PUT };
};

const firstInit = (call: ReturnType<typeof vi.fn<Call>>) => call.mock.calls[0]?.[1];

describe(createLead, () => {
  it('sends a value alone without a currency, so the workspace currency applies, and opens the lead', async () => {
    const { POST } = backend(201, { id: 5 });

    await createLead(1, { ...VALUES, estimatedValue: '1250.50' });

    expect(firstInit(POST)).toMatchObject({
      body: {
        firstName: 'Mia',
        companyName: 'Acme',
        priority: 'HIGH',
        estimatedValue: '1250.50',
        currency: undefined,
        lastName: undefined,
      },
    });
    expect(redirect).toHaveBeenCalledWith({ href: '/app/1/leads/5', locale: 'en' });
  });

  it('sends the value with its currency, and neither when there is no value', async () => {
    const { POST } = backend(201, { id: 5 });

    await createLead(1, { ...VALUES, estimatedValue: '10', currency: 'EUR' });
    await createLead(1, VALUES);

    expect(POST.mock.calls.map((call) => call[1])).toMatchObject([
      { body: { estimatedValue: '10', currency: 'EUR' } },
      { body: { estimatedValue: undefined, currency: undefined } },
    ]);
  });

  it('sends nothing for a currency without a value', async () => {
    const { POST } = backend(201, { id: 5 });

    const result = await createLead(1, { ...VALUES, currency: 'EUR' });

    expect(result).toStrictEqual({ ok: false, message: 'error_invalid_input' });
    expect(POST).not.toHaveBeenCalled();
  });
});

describe(updateLead, () => {
  it('sends the version read, and refreshes the page', async () => {
    const { PUT } = backend(200, { id: 5 });
    vi.mocked(refresh).mockClear();

    const result = await updateLead(1, 5, 3, VALUES);

    expect(result).toStrictEqual({ ok: true });
    expect(firstInit(PUT)).toMatchObject({ body: { version: 3 }, params: { path: { id: 5 } } });
    expect(refresh).toHaveBeenCalledOnce();
  });
});

describe(changeLeadStatus, () => {
  it('sends the reason with UNQUALIFIED only', async () => {
    const { POST } = backend(200, { id: 5 });

    await changeLeadStatus(1, 5, 3, { status: 'UNQUALIFIED', reason: 'No budget' });
    await changeLeadStatus(1, 5, 3, { status: 'CONTACTED', reason: 'ignored' });

    expect(POST.mock.calls.map((call) => call[1])).toMatchObject([
      { body: { status: 'UNQUALIFIED', reason: 'No budget', version: 3 } },
      { body: { status: 'CONTACTED', reason: undefined, version: 3 } },
    ]);
  });

  it('sends nothing for UNQUALIFIED without a reason, or for CONVERTED', async () => {
    const { POST } = backend(200, { id: 5 });

    // @ts-expect-error -- a forged call: CONVERTED is no target
    const forged = await changeLeadStatus(1, 5, 3, { status: 'CONVERTED', reason: '' });
    const bare = await changeLeadStatus(1, 5, 3, { status: 'UNQUALIFIED', reason: ' ' });

    expect([forged.ok, bare.ok]).toStrictEqual([false, false]);
    expect(POST).not.toHaveBeenCalled();
  });
});

describe(convertLead, () => {
  const CONVERSION = {
    leadId: 5,
    contact: { id: 9, fullName: 'Mia' },
    company: { id: 7, name: 'Acme' },
    alreadyConverted: true,
  };

  it('sends the links and the deal as the backend names them, and returns the result as it is', async () => {
    const { POST } = backend(200, CONVERSION);
    vi.mocked(refresh).mockClear();

    const result = await convertLead(1, 5, {
      companyId: 7,
      createCompany: false,
      contactId: null,
      deal: { name: 'Deal', amount: '10', currency: 'EUR', stageId: null, expectedCloseDate: null },
    });

    expect(result).toStrictEqual({ ok: true, conversion: CONVERSION });
    expect(firstInit(POST)).toMatchObject({
      params: { path: { workspaceId: 1, id: 5 } },
      body: {
        companyId: 7,
        createCompany: false,
        contactId: undefined,
        deal: { name: 'Deal', amount: '10', currency: 'EUR', stageId: undefined },
      },
    });
    // The dialog shows the result first and refreshes the page when it is closed.
    expect(refresh).not.toHaveBeenCalled();
  });

  it('gives a refusal as the failure it is', async () => {
    backend(409);
    vi.mocked(actionFailure).mockResolvedValue({
      ok: false,
      message: 'Only a qualified lead can be converted.',
    });

    await expect(
      convertLead(1, 5, { companyId: null, createCompany: true, contactId: null, deal: null }),
    ).resolves.toStrictEqual({ ok: false, message: 'Only a qualified lead can be converted.' });
  });
});
