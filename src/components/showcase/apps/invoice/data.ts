/** One party of the invoice (the seller or the customer). */
export type InvoiceParty = {
  name: string;
  street: string;
  city: string;
  email: string;
  phone: string;
};

/** A line of the invoice; amounts in cents. */
export type InvoiceLine = {
  item: string;
  description: string;
  quantity: number;
  unitCents: number;
};

/** The sample invoice of the Vue app, with fictional parties. */
export const INVOICE = {
  number: '90-98792',
  issuedOn: '2026-09-30',
  currency: 'USD',
  from: {
    name: 'Northgate Software Ltd',
    street: '42 Station Road',
    city: 'Leeds LS1 4AB, United Kingdom',
    email: 'billing@northgate.example',
    phone: '+44 113 496 0000',
  },
  to: {
    name: 'Riverside Academy',
    street: '8 Mill Lane',
    city: 'York YO1 7HH, United Kingdom',
    email: 'accounts@riverside.example',
    phone: '+44 1904 496 000',
  },
  vatNumber: 'GB 123 4567 89',
  accountName: 'Northgate Software Ltd',
  swift: 'NGSWGB2L',
  discountRate: 0.2,
  vatRate: 0.1,
  lines: [
    { item: 'Origin licence', description: 'Extended licence', quantity: 1, unitCents: 99_900 },
    {
      item: 'Custom services',
      description: 'Installation and customisation (per hour)',
      quantity: 20,
      unitCents: 15_000,
    },
    { item: 'Hosting', description: 'One-year subscription', quantity: 1, unitCents: 49_900 },
    {
      item: 'Platinum support',
      description: 'One-year subscription, 24/7',
      quantity: 1,
      unitCents: 399_900,
    },
  ] satisfies InvoiceLine[],
};
