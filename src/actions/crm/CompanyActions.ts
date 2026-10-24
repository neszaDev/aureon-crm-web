'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { RedirectType } from 'next/navigation';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import type { components } from '@/libs/api/schema';
import { redirect } from '@/libs/I18nNavigation';
import type { CompanyDuplicateValues, CompanyValues } from '@/validations/crm/CompanyValidation';
import {
  CompanyDuplicateValidation,
  CompanyValidation,
  companyValues,
} from '@/validations/crm/CompanyValidation';

/**
 * The request body of checked form values: an empty field is left out, which the backend reads
 * as none (and, on an update, clears), `ownerId` included.
 * @param values Checked form values.
 * @returns The `CompanyInput` fields.
 */
const companyBody = (values: CompanyValues) => ({
  name: values.name,
  industry: values.industry || undefined,
  website: values.website || undefined,
  phone: values.phone || undefined,
  address: values.address || undefined,
  employeeCount: values.employeeCount === '' ? undefined : Number(values.employeeCount),
  ownerId: values.ownerId ?? undefined,
  notes: values.notes || undefined,
});

/**
 * Creates a company (`POST /workspaces/{id}/companies`) and opens it, or stays on the page and
 * refreshes it (a list's inline add).
 * @param workspaceId The workspace.
 * @param values Form values; no owner means the caller.
 * @param options What follows a success.
 * @param options.stay Whether to stay and refresh the page rather than open the new company.
 * @returns Field or form errors; on success it redirects to the new company instead, or succeeds.
 */
export async function createCompany(
  workspaceId: number,
  values: CompanyValues,
  options?: { stay: boolean },
): Promise<ActionResult> {
  const t = await getTranslations('CompanyForm');
  const parsed = CompanyValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/companies', {
    params: { path: { workspaceId } },
    body: companyBody(parsed.data),
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }
  if (!data) {
    return { ok: false, message: t('error_generic') };
  }
  if (options?.stay) {
    refresh();
    return { ok: true };
  }

  // In place of the form: Back (and a record panel's close) skips it.
  return redirect(
    { href: `/app/${workspaceId}/companies/${data.id}`, locale: await getLocale() },
    RedirectType.replace,
  );
}

/**
 * Adds a company by its name alone from a list (its inline add): created as `createCompany`
 * does, with the owner and industry of the list's group or filter, and the list refreshed.
 * @param workspaceId The workspace.
 * @param preset What the list's group or filter gives it.
 * @param preset.ownerId Its owner; none means the caller.
 * @param preset.industry Its industry, or empty.
 * @param name The name typed.
 * @returns Success, or the refusal (its field errors by the backend's names).
 */
export async function addCompany(
  workspaceId: number,
  preset: { ownerId: number | null; industry: string },
  name: string,
): Promise<ActionResult> {
  return await createCompany(
    workspaceId,
    { ...preset, name, website: '', phone: '', address: '', employeeCount: '', notes: '' },
    { stay: true },
  );
}

/**
 * Saves a company's fields (`PUT /workspaces/{id}/companies/{id}`) and refreshes the page.
 * @param workspaceId The workspace.
 * @param companyId The company.
 * @param version The version the form was read at; an outdated one is the reload message.
 * @param values Form values, with the owner to keep, reassign to, or none to unassign.
 * @returns Success, or field and form errors.
 */
export async function updateCompany(
  workspaceId: number,
  companyId: number,
  version: number,
  values: CompanyValues,
): Promise<ActionResult> {
  const t = await getTranslations('CompanyForm');
  const parsed = CompanyValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.PUT('/api/v1/workspaces/{workspaceId}/companies/{id}', {
    params: { path: { workspaceId, id: companyId } },
    body: { ...companyBody(parsed.data), version },
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Gives a company to another owner (a list's bulk action). There is no owner endpoint: it reads the
 * company and saves its fields back unchanged through `updateCompany`, with the new owner, at the
 * version the list read, so a company changed since is the reload message.
 * @param workspaceId The workspace.
 * @param companyId The company.
 * @param version The version the list read; none (a list without versions: companies,
 *   contacts) sends the one just read.
 * @param ownerId The new owner.
 * @returns Success, or the translated refusal.
 */
export async function assignCompany(
  workspaceId: number,
  companyId: number,
  version: number | undefined,
  ownerId: number,
): Promise<ActionResult> {
  const api = await authedBackend();
  const { data, error, response } = await api.GET(
    '/api/v1/workspaces/{workspaceId}/companies/{id}',
    {
      params: { path: { workspaceId, id: companyId } },
    },
  );
  if (!data) {
    return await actionFailure(response, error);
  }

  return await updateCompany(workspaceId, companyId, version ?? data.version, {
    ...companyValues(data),
    ownerId,
  });
}

/**
 * Archives a company (`POST .../companies/{id}/archive`): it leaves the lists, its history stays.
 * @param workspaceId The workspace.
 * @param companyId The company.
 * @returns Success, or the translated refusal.
 */
export async function archiveCompany(
  workspaceId: number,
  companyId: number,
): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.POST(
    '/api/v1/workspaces/{workspaceId}/companies/{id}/archive',
    { params: { path: { workspaceId, id: companyId } } },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Restores an archived company (`POST .../companies/{id}/restore`).
 * @param workspaceId The workspace.
 * @param companyId The company.
 * @returns Success, or the translated refusal.
 */
export async function restoreCompany(
  workspaceId: number,
  companyId: number,
): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.POST(
    '/api/v1/workspaces/{workspaceId}/companies/{id}/restore',
    { params: { path: { workspaceId, id: companyId } } },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Finds active companies that look like the one being entered: the same name, or the same
 * website host (`GET .../companies/duplicates`). A hint only: any failure finds none.
 * @param workspaceId The workspace.
 * @param values The name and website as typed.
 * @param excludeId The company being edited, which matches itself.
 * @returns Up to 5 companies.
 */
export async function findCompanyDuplicates(
  workspaceId: number,
  values: CompanyDuplicateValues,
  excludeId?: number,
): Promise<components['schemas']['CompanyRef'][]> {
  const parsed = CompanyDuplicateValidation.safeParse(values);
  if (!parsed.success || (!parsed.data.name && !parsed.data.website)) {
    return [];
  }

  const api = await authedBackend();
  const { data } = await api.GET('/api/v1/workspaces/{workspaceId}/companies/duplicates', {
    params: {
      path: { workspaceId },
      query: { name: parsed.data.name || undefined, website: parsed.data.website || undefined },
    },
  });

  return (data ?? []).filter((company) => company.id !== excludeId);
}
