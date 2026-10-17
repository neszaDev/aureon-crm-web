import { useLocale } from 'next-intl';
import { createWorkspace } from '@/actions/crm/WorkspaceActions';
import { WorkspaceForm } from '@/components/crm/WorkspaceForm';
import { CURRENCIES, TIME_ZONES } from '@/validations/crm/WorkspaceValidation';

/**
 * The workspace form wired to `createWorkspace`, with currency names in the page's language.
 * The lists are built here, on the server, so the browser hydrates the same options.
 * @returns The form.
 */
export const CreateWorkspaceForm = () => {
  const currencyNames = new Intl.DisplayNames(useLocale(), { type: 'currency' });
  const currencies = CURRENCIES.map((code) => ({
    value: code,
    label: `${code} · ${currencyNames.of(code) ?? code}`,
  }));

  return <WorkspaceForm action={createWorkspace} currencies={currencies} timeZones={TIME_ZONES} />;
};
