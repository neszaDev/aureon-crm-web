import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { CourseOptionPanel, OrganizationFilterPanel } from './FilterPanels';
import { quickRange } from './filters';

const organizations = [
  {
    _id: 'org-1',
    title: [
      { key: 'en', value: 'Mae Fah Luang University' },
      { key: 'th', value: 'มหาวิทยาลัยแม่ฟ้าหลวง' },
    ],
  },
];
const agencies = [{ _id: 'agency-1', title: [{ key: 'en', value: 'Service centre' }] }];

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(OrganizationFilterPanel, () => {
  it('preselects the first organisation and fills the dates of a quick range', async () => {
    await render(
      withIntl(<OrganizationFilterPanel units={{ organizations, agencies, departments: [] }} />),
    );

    await expect
      .element(page.getByRole('button', { name: 'Organisation' }))
      .toHaveTextContent('Mae Fah Luang University');

    await page.getByRole('radio', { name: 'Yesterday' }).click();
    const yesterday = quickRange('yesterday', new Date());

    await expect.element(page.getByLabelText('Start date')).toHaveValue(yesterday.start);
    await expect.element(page.getByLabelText('End date')).toHaveValue(yesterday.end);
  });

  it('chooses an agency through the search list', async () => {
    await render(
      withIntl(<OrganizationFilterPanel units={{ organizations, agencies, departments: [] }} />),
    );

    await page.getByRole('button', { name: 'Agency' }).click();
    await page.getByRole('option', { name: 'Service centre' }).click();

    await expect
      .element(page.getByRole('button', { name: 'Agency' }))
      .toHaveTextContent('Service centre');
    await expect.element(page.getByText('"agency": "agency-1"')).toBeInTheDocument();
  });
});

describe(CourseOptionPanel, () => {
  it('starts on the Buddhist year and emits the changed semester', async () => {
    await render(withIntl(<CourseOptionPanel universities={organizations} />));

    await expect
      .element(page.getByLabelText('Academic year'))
      .toHaveValue(new Date().getFullYear() + 543);

    await page.getByLabelText('Semester').selectOptions('2');

    await expect.element(page.getByText('"semester": 2')).toBeInTheDocument();
  });
});
