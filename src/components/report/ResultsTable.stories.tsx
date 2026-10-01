import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/locales/en.json';
import { ResultsTable } from './ResultsTable';

const meta = {
  title: 'Report/ResultsTable',
  component: ResultsTable,
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <div className="paper max-w-3xl p-4">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
} satisfies Meta<typeof ResultsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithResults: Story = {
  args: {
    rows: [
      {
        id: 1,
        testName: 'Driving theory test',
        status: 'PASSED',
        score: 94,
        testedAt: '2026-09-28T09:30:00Z',
      },
      {
        id: 2,
        testName: 'Spanish B1 mock exam',
        status: 'FAILED',
        score: 58,
        testedAt: '2026-09-24T14:00:00Z',
        notes: 'Retake the listening part',
      },
      {
        id: 3,
        testName: 'Piano grade 3 mock',
        status: 'PENDING',
        score: 81.5,
        testedAt: '2026-09-09T11:00:00Z',
      },
    ],
    drawDelays: new Map([
      [1, 0],
      [2, 200],
      [3, 400],
    ]),
  },
};

export const Empty: Story = {
  args: {
    rows: [],
    empty: <p className="font-bold">No test results yet</p>,
  },
};
