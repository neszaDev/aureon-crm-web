'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { RedirectType } from 'next/navigation';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import type { components } from '@/libs/api/schema';
import { redirect } from '@/libs/I18nNavigation';
import type { ContactDuplicateValues, ContactValues } from '@/validations/crm/ContactValidation';
import { ContactDuplicateValidation, ContactValidation } from '@/validations/crm/ContactValidation';

/**
 * The request body of checked form values: an empty field is left out, which the backend reads
 * as none (and, on an update, clears), the links and `ownerId` included.
 * @param values Checked form values.
 * @returns The `ContactInput` fields.
 */
const contactBody = (values: ContactValues) => ({
  firstName: values.firstName,
  lastName: values.lastName || undefined,
  email: values.email || undefined,
  phone: values.phone || undefined,
  jobTitle: values.jobTitle || undefined,
  companyId: values.companyId ?? undefined,
  ownerId: values.ownerId ?? undefined,
  sourceId: values.sourceId ?? undefined,
  tags: values.tags,
  notes: values.notes || undefined,
});

/**
 * Creates a contact (`POST /workspaces/{id}/contacts`) and opens it.
 * @param workspaceId The workspace.
 * @param values Form values; no owner means the caller.
 * @returns Field or form errors; on success it redirects to the new contact instead.
 */
export async function createContact(
  workspaceId: number,
  values: ContactValues,
): Promise<ActionResult> {
  const t = await getTranslations('ContactForm');
  const parsed = ContactValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/contacts', {
    params: { path: { workspaceId } },
    body: contactBody(parsed.data),
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }
  if (!data) {
    return { ok: false, message: t('error_generic') };
  }

  // In place of the form: Back (and a record panel's close) skips it.
  return redirect(
    { href: `/app/${workspaceId}/contacts/${data.id}`, locale: await getLocale() },
    RedirectType.replace,
  );
}

/**
 * Saves a contact's fields (`PUT /workspaces/{id}/contacts/{id}`) and refreshes the page.
 * @param workspaceId The workspace.
 * @param contactId The contact.
 * @param version The version the form was read at; an outdated one is the reload message.
 * @param values Form values, with the owner to keep, reassign to, or none to unassign.
 * @returns Success, or field and form errors.
 */
export async function updateContact(
  workspaceId: number,
  contactId: number,
  version: number,
  values: ContactValues,
): Promise<ActionResult> {
  const t = await getTranslations('ContactForm');
  const parsed = ContactValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.PUT('/api/v1/workspaces/{workspaceId}/contacts/{id}', {
    params: { path: { workspaceId, id: contactId } },
    body: { ...contactBody(parsed.data), version },
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Archives a contact (`POST .../contacts/{id}/archive`): it leaves the lists, its history stays.
 * @param workspaceId The workspace.
 * @param contactId The contact.
 * @returns Success, or the translated refusal.
 */
export async function archiveContact(
  workspaceId: number,
  contactId: number,
): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.POST(
    '/api/v1/workspaces/{workspaceId}/contacts/{id}/archive',
    { params: { path: { workspaceId, id: contactId } } },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Restores an archived contact (`POST .../contacts/{id}/restore`).
 * @param workspaceId The workspace.
 * @param contactId The contact.
 * @returns Success, or the translated refusal.
 */
export async function restoreContact(
  workspaceId: number,
  contactId: number,
): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.POST(
    '/api/v1/workspaces/{workspaceId}/contacts/{id}/restore',
    { params: { path: { workspaceId, id: contactId } } },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Finds active contacts that look like the one being entered: the same email in any case, or the
 * same phone digits, at least 6 (`GET .../contacts/duplicates`). A hint only: any failure finds
 * none.
 * @param workspaceId The workspace.
 * @param values The email and phone as typed.
 * @param excludeId The contact being edited, which matches itself.
 * @returns Up to 5 contacts.
 */
export async function findContactDuplicates(
  workspaceId: number,
  values: ContactDuplicateValues,
  excludeId?: number,
): Promise<components['schemas']['ContactRef'][]> {
  const parsed = ContactDuplicateValidation.safeParse(values);
  if (!parsed.success || (!parsed.data.email && !parsed.data.phone)) {
    return [];
  }

  const api = await authedBackend();
  const { data } = await api.GET('/api/v1/workspaces/{workspaceId}/contacts/duplicates', {
    params: {
      path: { workspaceId },
      query: { email: parsed.data.email || undefined, phone: parsed.data.phone || undefined },
    },
  });

  return (data ?? []).filter((contact) => contact.id !== excludeId);
}
