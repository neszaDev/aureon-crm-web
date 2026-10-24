import { useLocale } from 'next-intl';
import { createWorkspace } from '@/actions/crm/WorkspaceActions';
import { WorkspaceForm } from '@/components/crm/WorkspaceForm';
import { CURRENCIES, TIME_ZONES } from '@/validations/crm/WorkspaceValidation';

/**
 * The currency options of the workspace form: each code with its name in a language. Built on
 * the server, so the browser hydrates the same options.
 * @param locale The page's locale.
 * @returns The options.
 */
export const currencyOptions = (locale: string) => {
  const names = new Intl.DisplayNames(locale, { type: 'currency' });

  return CURRENCIES.map((code) => ({ value: code, label: `${code} · ${names.of(code) ?? code}` }));
};

/**
 * The workspace form wired to `createWorkspace`, with currency names in the page's language.
 * The lists are built here, on the server, so the browser hydrates the same options.
 * @returns The form.
 */
export const CreateWorkspaceForm = () => (
  <WorkspaceForm
    action={createWorkspace}
    currencies={currencyOptions(useLocale())}
    timeZones={TIME_ZONES}
  />
);
