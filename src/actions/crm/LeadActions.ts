'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { RedirectType } from 'next/navigation';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import type { components } from '@/libs/api/schema';
import { redirect } from '@/libs/I18nNavigation';
import type {
  ConversionValues,
  LEAD_TARGETS,
  LeadStatusChange,
  LeadValues,
} from '@/validations/crm/LeadValidation';
import {
  ConversionValidation,
  LeadStatusValidation,
  LeadValidation,
} from '@/validations/crm/LeadValidation';

/** What converting gives back: the records linked or created, `alreadyConverted` on a repeat. */
export type ConvertResult = ActionResult & {
  conversion?: components['schemas']['LeadConversionResponse'];
};

/**
 * The request body of checked form values: an empty field is left out, which the backend reads
 * as none (and, on an update, clears), the links and `ownerId` included. A value without a
 * currency takes the workspace's.
 * @param values Checked form values.
 * @returns The `LeadInput` fields.
 */
const leadBody = (values: LeadValues) => ({
  firstName: values.firstName,
  lastName: values.lastName || undefined,
  companyName: values.companyName || undefined,
  email: values.email || undefined,
  phone: values.phone || undefined,
  jobTitle: values.jobTitle || undefined,
  sourceId: values.sourceId ?? undefined,
  ownerId: values.ownerId ?? undefined,
  priority: values.priority,
  followUpDate: values.followUpDate || undefined,
  estimatedValue: values.estimatedValue || undefined,
  currency: values.currency || undefined,
  notes: values.notes || undefined,
});

/**
 * Creates a lead (`POST /workspaces/{id}/leads`) and opens it.
 * @param workspaceId The workspace.
 * @param values Form values; no owner means the caller.
 * @returns Field or form errors; on success it redirects to the new lead instead.
 */
export async function createLead(workspaceId: number, values: LeadValues): Promise<ActionResult> {
  const t = await getTranslations('LeadForm');
  const parsed = LeadValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/leads', {
    params: { path: { workspaceId } },
    body: leadBody(parsed.data),
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }
  if (!data) {
    return { ok: false, message: t('error_generic') };
  }

  // In place of the form: Back (and a record panel's close) skips it.
  return redirect(
    { href: `/app/${workspaceId}/leads/${data.id}`, locale: await getLocale() },
    RedirectType.replace,
  );
}

// The statuses a list's inline add puts a new lead in.
const INLINE_STATUSES = new Set<string>(['NEW', 'CONTACTED', 'QUALIFIED']);

/**
 * Adds a lead from a list (its inline add): its name, split into first and last at the first
 * space, and its company, owned by the list's group or filter (none: the caller), then moved to
 * the group's status, from its first version. The list refreshes. A refused name is the `name`
 * field's error; a move refused after the lead was made is still a success (the lead exists, so
 * the field clears), whose message says that it was added as New. A status the inline add can't
 * start in (the preset comes from the browser), or a name or company that is not text, is refused
 * before anything is made.
 * @param workspaceId The workspace.
 * @param preset What the list's group or filter gives it.
 * @param preset.status The status it lands in (New is where every lead starts).
 * @param preset.ownerId Its owner; none means the caller.
 * @param name The name typed.
 * @param company The company typed, or empty.
 * @returns Success, or the refusal.
 */
export async function addLead(
  workspaceId: number,
  preset: { status: Exclude<(typeof LEAD_TARGETS)[number], 'UNQUALIFIED'>; ownerId: number | null },
  name: string,
  company = '',
): Promise<ActionResult> {
  const t = await getTranslations('LeadForm');
  // What the browser sent, as it sent it: checked before it is read.
  if (
    !INLINE_STATUSES.has(preset.status) ||
    typeof name !== 'string' ||
    typeof company !== 'string'
  ) {
    return { ok: false, message: t('error_invalid_input') };
  }
  const [firstName = '', ...rest] = name.trim().split(/\s+/u);
  const parsed = LeadValidation.safeParse({
    firstName,
    lastName: rest.join(' '),
    companyName: company,
    email: '',
    phone: '',
    jobTitle: '',
    sourceId: null,
    ownerId: preset.ownerId,
    priority: 'MEDIUM',
    followUpDate: '',
    estimatedValue: '',
    currency: '',
    notes: '',
  });
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/leads', {
    params: { path: { workspaceId } },
    body: leadBody(parsed.data),
  });
  if (!response.ok) {
    const failure = await actionFailure(response, error);
    const nameError = failure.fieldErrors?.firstName ?? failure.fieldErrors?.lastName;
    return nameError ? { ...failure, fieldErrors: { name: nameError } } : failure;
  }
  if (data && preset.status !== 'NEW') {
    const moved = await api.POST('/api/v1/workspaces/{workspaceId}/leads/{id}/status', {
      params: { path: { workspaceId, id: data.id } },
      body: { status: preset.status, version: data.version },
    });
    if (!moved.response.ok) {
      const failure = await actionFailure(moved.response, moved.error);
      refresh();
      return { ok: true, message: t('added_as_new', { reason: failure.message ?? '' }) };
    }
  }

  refresh();
  return { ok: true };
}

/**
 * Saves a lead's fields (`PUT /workspaces/{id}/leads/{id}`) and refreshes the page.
 * @param workspaceId The workspace.
 * @param leadId The lead.
 * @param version The version the form was read at; an outdated one is the reload message.
 * @param values Form values, with the owner to keep, reassign to, or none to unassign.
 * @returns Success, or field and form errors (a converted lead can't be edited).
 */
export async function updateLead(
  workspaceId: number,
  leadId: number,
  version: number,
  values: LeadValues,
): Promise<ActionResult> {
  const t = await getTranslations('LeadForm');
  const parsed = LeadValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.PUT('/api/v1/workspaces/{workspaceId}/leads/{id}', {
    params: { path: { workspaceId, id: leadId } },
    body: { ...leadBody(parsed.data), version },
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Archives a lead (`POST .../leads/{id}/archive`): it leaves the lists, its history stays. A
 * converted lead can be archived too.
 * @param workspaceId The workspace.
 * @param leadId The lead.
 * @returns Success, or the translated refusal.
 */
export async function archiveLead(workspaceId: number, leadId: number): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.POST(
    '/api/v1/workspaces/{workspaceId}/leads/{id}/archive',
    {
      params: { path: { workspaceId, id: leadId } },
    },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Restores an archived lead (`POST .../leads/{id}/restore`).
 * @param workspaceId The workspace.
 * @param leadId The lead.
 * @returns Success, or the translated refusal.
 */
export async function restoreLead(workspaceId: number, leadId: number): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.POST(
    '/api/v1/workspaces/{workspaceId}/leads/{id}/restore',
    {
      params: { path: { workspaceId, id: leadId } },
    },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Moves a lead to another status (`POST .../leads/{id}/status`) and refreshes the page.
 * UNQUALIFIED needs a reason, which is sent with it only; CONVERTED isn't a target (conversion
 * has its own action).
 * @param workspaceId The workspace.
 * @param leadId The lead.
 * @param version The version the page was read at; an outdated one is the reload message.
 * @param change The new status and, for UNQUALIFIED, the reason.
 * @returns Success, or the translated refusal (a converted lead can't change status).
 */
export async function changeLeadStatus(
  workspaceId: number,
  leadId: number,
  version: number,
  change: LeadStatusChange,
): Promise<ActionResult> {
  const t = await getTranslations('UnqualifyDialog');
  const parsed = LeadStatusValidation.safeParse(change);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/leads/{id}/status', {
    params: { path: { workspaceId, id: leadId } },
    body: {
      status: parsed.data.status,
      reason: parsed.data.status === 'UNQUALIFIED' ? parsed.data.reason : undefined,
      version,
    },
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Converts a qualified lead (`POST .../leads/{id}/convert`): links or creates its company and
 * contact, and a deal when asked, in one transaction. A repeat (a double click, a retry) gives
 * the first result with `alreadyConverted`. It doesn't refresh the page: the dialog shows the
 * result first, and refreshes when it closes.
 * @param workspaceId The workspace.
 * @param leadId The lead.
 * @param values How to convert it; deal errors come back as `deal.<field>` field errors.
 * @returns The conversion, or field and form errors.
 */
export async function convertLead(
  workspaceId: number,
  leadId: number,
  values: ConversionValues,
): Promise<ConvertResult> {
  const t = await getTranslations('ConvertDialog');
  const parsed = ConversionValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }
  const { companyId, createCompany, contactId, deal } = parsed.data;

  const api = await authedBackend();
  const { data, error, response } = await api.POST(
    '/api/v1/workspaces/{workspaceId}/leads/{id}/convert',
    {
      params: { path: { workspaceId, id: leadId } },
      body: {
        companyId: companyId ?? undefined,
        createCompany,
        contactId: contactId ?? undefined,
        deal: deal
          ? {
              name: deal.name,
              amount: deal.amount,
              currency: deal.currency,
              stageId: deal.stageId ?? undefined,
              expectedCloseDate: deal.expectedCloseDate ?? undefined,
            }
          : undefined,
      },
    },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }
  if (!data) {
    return { ok: false, message: t('error_generic') };
  }

  return { ok: true, conversion: data };
}
