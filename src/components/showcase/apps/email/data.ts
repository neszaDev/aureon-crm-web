/** The folders of the mail sidebar, in the Vue order (Drafts and Archive added). */
export const MAIL_FOLDERS = [
  'inbox',
  'starred',
  'sent',
  'drafts',
  'archive',
  'trash',
  'important',
  'spam',
] as const;

export type MailFolder = (typeof MAIL_FOLDERS)[number];

/** Where a message is stored; starred and important are flags shown as folders. */
export type MailBox = 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash' | 'spam';

/** The labels of the Vue label dropdown. */
export const MAIL_LABELS = ['home', 'job', 'clients', 'news'] as const;

export type MailLabel = (typeof MAIL_LABELS)[number];

/** The dot colour of each label, in Marksheet tokens (red pen stays for errors). */
export const LABEL_DOT: Record<MailLabel, string> = {
  home: 'bg-folder',
  job: 'bg-ink-700',
  clients: 'bg-pass',
  news: 'bg-pencil',
};

export type MailAttachment = {
  name: string;
  /** File type shown as a tag, e.g. `zip`. */
  kind: string;
  /** Size in kilobytes. */
  sizeKb: number;
};

/** A message of the sample mailbox. */
export type Mail = {
  id: string;
  from: string;
  email: string;
  /** Recipient, for sent messages and drafts. */
  to?: string;
  sentAt: string;
  subject: string;
  /** Body paragraphs; the first is the list preview. */
  body: string[];
  /** A quoted passage under the body, as in the Vue message. */
  quote?: string;
  read: boolean;
  starred: boolean;
  important: boolean;
  box: MailBox;
  labels: MailLabel[];
  attachments: MailAttachment[];
};

/** The signed-in mailbox owner, sender of sent messages and drafts. */
export const ME = { name: 'Jordan Ellis', email: 'jordan.ellis@riverside.example' };

const mail = (
  message: Pick<Mail, 'id' | 'from' | 'email' | 'sentAt' | 'subject' | 'body'> & Partial<Mail>,
): Mail => ({
  read: true,
  starred: false,
  important: false,
  box: 'inbox',
  labels: [],
  attachments: [],
  ...message,
});

/** The sample mailbox: the 13 inbox rows of the Vue app (4 unread) plus a few other folders. */
export const MAILS: Mail[] = [
  mail({
    id: 'm01',
    from: 'Lukas Holder',
    email: 'lukas.holder@northgate.example',
    sentAt: '2026-10-02T15:47:00Z',
    subject: 'Term report templates are ready',
    body: [
      'The new report card templates are ready for review. Each subject now has its own remark field and the totals strip prints on the first page.',
      'Could you check the French version before Friday? The layout should be the same, but some labels run longer.',
    ],
    quote:
      'Please keep the double rule under every header band; the printer at the main office cuts close to the margins.',
    read: false,
    important: true,
    labels: ['job'],
    attachments: [
      { name: 'report-templates.zip', kind: 'zip', sizeKb: 2560 },
      { name: 'readme.txt', kind: 'txt', sizeKb: 7 },
      { name: 'class-lists.xls', kind: 'xls', sizeKb: 984 },
    ],
  }),
  mail({
    id: 'm02',
    from: 'Amira Haddad',
    email: 'amira.haddad@riverside.example',
    sentAt: '2026-10-02T11:20:00Z',
    subject: 'Parents evening schedule',
    body: [
      'Here is the draft schedule for parents evening. Slots are ten minutes, with a short break every hour.',
    ],
  }),
  mail({
    id: 'm03',
    from: 'Tomás Ferreira',
    email: 'tomas.ferreira@riverside.example',
    sentAt: '2026-10-01T16:05:00Z',
    subject: 'Science lab booking for Year 9',
    body: ['Lab 2 is free on Tuesday afternoons for the rest of term. Shall I book it for Year 9?'],
    starred: true,
  }),
  mail({
    id: 'm04',
    from: 'Grace Okafor',
    email: 'grace.okafor@riverside.example',
    sentAt: '2026-10-01T09:12:00Z',
    subject: 'Missing marks for the history mock',
    body: [
      'Three pupils still have no mark for the history mock exam. Could you add them before the report run tonight?',
    ],
    read: false,
    important: true,
  }),
  mail({
    id: 'm05',
    from: 'Henrik Larsen',
    email: 'henrik.larsen@northgate.example',
    sentAt: '2026-09-30T14:30:00Z',
    subject: 'Invoice 90-98792',
    body: ['Please find attached the invoice for the extended licence and the support plan.'],
    labels: ['clients'],
  }),
  mail({
    id: 'm06',
    from: 'Mei Tanaka',
    email: 'mei.tanaka@riverside.example',
    sentAt: '2026-09-30T08:45:00Z',
    subject: 'Sports day volunteers',
    body: ['We still need four volunteers for sports day. Reply to this message if you can help.'],
    read: false,
    labels: ['news'],
  }),
  mail({
    id: 'm07',
    from: 'Daniel Brooks',
    email: 'daniel.brooks@riverside.example',
    sentAt: '2026-09-29T17:10:00Z',
    subject: 'Re: Reading list for autumn',
    body: ['Thanks for the list. I swapped two titles that the library does not stock.'],
  }),
  mail({
    id: 'm08',
    from: 'Sofia Rossi',
    email: 'sofia.rossi@riverside.example',
    sentAt: '2026-09-29T10:00:00Z',
    subject: 'Staff meeting moved to Thursday',
    body: ['The staff meeting moves to Thursday at 4 pm in the library.'],
    important: true,
  }),
  mail({
    id: 'm09',
    from: 'Kwame Mensah',
    email: 'kwame.mensah@riverside.example',
    sentAt: '2026-09-28T13:25:00Z',
    subject: 'Maths set changes',
    body: ['Two pupils move from set 2 to set 1 after the September assessment.'],
  }),
  mail({
    id: 'm10',
    from: 'Laura Novak',
    email: 'laura.novak@home.example',
    sentAt: '2026-09-27T19:40:00Z',
    subject: 'Dinner on Saturday?',
    body: ['Are you free on Saturday evening? We are trying the new place by the river.'],
    labels: ['home'],
  }),
  mail({
    id: 'm11',
    from: 'Priya Nair',
    email: 'priya.nair@riverside.example',
    sentAt: '2026-09-26T12:15:00Z',
    subject: 'Exam board deadlines',
    body: ['A reminder that entries for the winter series close on the 15th.'],
    important: true,
  }),
  mail({
    id: 'm12',
    from: 'Oliver Grant',
    email: 'oliver.grant@riverside.example',
    sentAt: '2026-09-25T09:30:00Z',
    subject: 'Trip consent forms',
    body: ['Twelve consent forms are still missing for the museum trip next week.'],
    read: false,
  }),
  mail({
    id: 'm13',
    from: 'Elena Petrova',
    email: 'elena.petrova@riverside.example',
    sentAt: '2026-09-24T15:55:00Z',
    subject: 'Thank you',
    body: ['Thank you for covering my class on Monday. The pupils enjoyed the quiz.'],
    starred: true,
    important: true,
  }),
  mail({
    id: 'm14',
    from: ME.name,
    email: ME.email,
    to: 'amira.haddad@riverside.example',
    sentAt: '2026-09-23T10:05:00Z',
    subject: 'Room change for Year 7',
    body: ['Year 7 English moves to room 12 from next week.'],
    box: 'sent',
  }),
  mail({
    id: 'm15',
    from: 'Prize Desk',
    email: 'winner@prizes.example',
    sentAt: '2026-09-22T03:12:00Z',
    subject: 'You have won a tablet!',
    body: ['Claim your prize now by entering your card details.'],
    read: false,
    box: 'spam',
  }),
  mail({
    id: 'm16',
    from: 'Library',
    email: 'library@riverside.example',
    sentAt: '2026-09-20T08:00:00Z',
    subject: 'Overdue books',
    body: ['Two books on your account are overdue.'],
    box: 'trash',
  }),
];
