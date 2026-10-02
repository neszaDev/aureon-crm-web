import 'server-only';
import { authedBackend } from './Backend';
import {
  placeholderAgencies,
  placeholderDepartments,
  placeholderOrganizations,
  placeholderProfile,
} from './CampusPlaceholders';

// Read-side backend calls used by server components. Pages depend on these functions, not on
// API paths, so an endpoint change is fixed in one place (and flagged by `schema.d.ts` types).
// Each returns `unauthorized: true` when the backend rejects the session (HTTP 401).

/**
 * Loads the signed-in user (`GET /users/me`).
 * @returns The user, or `unauthorized` when the session is no longer valid.
 */
export const getCurrentUser = async () => {
  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/users/me');

  return { user: data, unauthorized: response.status === 401 };
};

/**
 * Loads one page of the user's test results plus the per-status summary.
 * @param page Zero-based page number.
 * @param size Page size (the backend allows 1-100).
 * @returns The page, the summary, when they were read (`readAt`, epoch ms), or `unauthorized`
 * when the session is no longer valid.
 */
export const listTestResults = async (page: number, size: number) => {
  const api = await authedBackend();
  const [list, summary] = await Promise.all([
    api.GET('/api/v1/test-results', { params: { query: { page, size } } }),
    api.GET('/api/v1/test-results/summary'),
  ]);

  return {
    results: list.data,
    summary: summary.data,
    readAt: Date.now(),
    unauthorized: list.response.status === 401 || summary.response.status === 401,
  };
};

/**
 * Loads the organisations, agencies and departments for the campus filters.
 * Placeholder data until the Spring API serves them (Vue: `POST /api/v1/organization/explorers`).
 * @returns The three lists.
 */
export const listOrgUnits = async () => {
  await Promise.resolve();

  return {
    organizations: placeholderOrganizations,
    agencies: placeholderAgencies,
    departments: placeholderDepartments,
  };
};

/**
 * Loads the signed-in person's campus profile.
 * Placeholder data until the Spring API serves it (Vue: `POST /api/v1/system/profile`).
 * @returns The profile.
 */
export const getCampusProfile = async () => {
  await Promise.resolve();

  return placeholderProfile;
};
