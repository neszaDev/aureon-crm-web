import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { searchRecords } from '@/actions/crm/RecordSearchActions';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
import type { ContactDuplicateValues, ContactValues } from '@/validations/crm/ContactValidation';
import { ContactForm } from './ContactForm';

vi.mock(import('@/actions/crm/RecordSearchActions'), () => ({
  searchRecords: vi.fn<typeof searchRecords>(),
}));

type Action = (values: ContactValues) => Promise<ActionResult>;
type FindDuplicates = (
  values: ContactDuplicateValues,
  excludeId?: number,
) => Promise<components['schemas']['ContactRef'][]>;

const ME = 1;
const SAVED: ContactValues = {
  firstName: 'Mia',
  lastName: 'Chan',
  email: 'mia@acme.test',
  phone: '',
  jobTitle: '',
  companyId: 7,
  ownerId: ME,
  sourceId: null,
  tags: ['b2b'],
  notes: '',
};

const renderForm = async (props: { action: Action; findDuplicates?: FindDuplicates }) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <ContactForm
        action={props.action}
        findDuplicates={props.findDuplicates ?? vi.fn<FindDuplicates>().mockResolvedValue([])}
        defaults={SAVED}
        company={{ id: 7, label: 'Acme' }}
        recordId={42}
        workspaceId={1}
        members={[{ userId: ME, email: 'mia@acme.test', displayName: 'Mia Manager' }]}
        me={ME}
        canAssign
        sources={[]}
        tags={['vip']}
        listPath="/app/1/contacts"
        cancelHref="/app/1/contacts/42"
        submitLabel="Save changes"
      />
    </NextIntlClientProvider>,
  );
};

describe(ContactForm, () => {
  it('sends the picked company and the tags, and Enter in the tags does not submit', async () => {
    vi.mocked(searchRecords).mockResolvedValue([{ id: 9, label: 'Globex' }]);
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await renderForm({ action });

    await page.getByRole('combobox', { name: 'Company' }).click();
    await page.getByRole('option', { name: /Globex/u }).click();
    await userEvent.type(page.getByLabelText('Tags', { exact: true }), 'VIP{Enter}');
    expect(action).not.toHaveBeenCalled();
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 9, tags: ['b2b', 'vip'] }),
    );
  });

  it("marks the field invalid and shows the backend's error under it", async () => {
    await renderForm({
      action: vi.fn<Action>().mockResolvedValue({
        ok: false,
        message: 'Check the highlighted fields and try again.',
        fieldErrors: { lastName: 'must not be blank' },
      }),
    });

    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect
      .element(page.getByLabelText('Last name'))
      .toHaveAccessibleDescription('must not be blank');
    await expect.element(page.getByLabelText('Last name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('lists possible duplicates, other than this contact, after the email loses focus', async () => {
    const findDuplicates = vi
      .fn<FindDuplicates>()
      .mockResolvedValue([{ id: 7, fullName: 'Mia C.', email: 'mia@acme.test' }]);
    await renderForm({ action: vi.fn<Action>(), findDuplicates });

    await page.getByLabelText('Email').fill('MIA@acme.test');
    await page.getByLabelText('Phone').click();

    const link = page.getByRole('link', { name: /Mia C\./u });
    await expect.element(link).toHaveAttribute('href', '/app/1/contacts/7');
    expect(findDuplicates).toHaveBeenCalledWith({ email: 'MIA@acme.test', phone: '' }, 42);
  });

  it('shows what was stored after saving: the email in lower case, the tags sorted', async () => {
    await renderForm({ action: vi.fn<Action>().mockResolvedValue({ ok: true }) });

    await page.getByLabelText('Email').fill(' MIA@Acme.Test ');
    await userEvent.type(page.getByLabelText('Tags', { exact: true }), 'alpha{Enter}');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await expect.element(page.getByLabelText('Email')).toHaveValue('mia@acme.test');
    expect(
      page
        .getByRole('list', { name: 'Added' })
        .getByRole('button')
        .elements()
        .map((button) => button.getAttribute('aria-label')),
    ).toStrictEqual(['Remove alpha', 'Remove b2b']);
  });

  it('says a tag is too long as soon as it is added', async () => {
    const action = vi.fn<Action>();
    await renderForm({ action });

    await userEvent.type(page.getByLabelText('Tags', { exact: true }), `${'x'.repeat(41)}{Enter}`);

    await expect.element(page.getByText('Each tag takes 1 to 40 characters')).toBeVisible();
    expect(action).not.toHaveBeenCalled();
  });

  it('sends what was typed since the last save, not the values saved before', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await renderForm({ action });

    await page.getByLabelText('First name').fill('Mina');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByLabelText('First name').fill('Mira');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledTimes(2);
    });
    expect(action).toHaveBeenLastCalledWith(expect.objectContaining({ firstName: 'Mira' }));
  });
});
