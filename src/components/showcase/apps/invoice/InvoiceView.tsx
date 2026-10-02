import { useFormatter, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InvoiceParty } from './data';
import { INVOICE } from './data';
import { InvoiceActions, PaymentButton } from './InvoiceActions';
import { invoiceTotals } from './totals';

// On paper only the invoice prints: the app shell and page header are hidden, and the card
// moves to the top-left of the sheet.
const PRINT_CSS = `@media print {
  body * { visibility: hidden; }
  [data-print-root], [data-print-root] * { visibility: visible; }
  [data-print-root] { position: absolute; top: 0; left: 0; width: 100%; }
}`;

/**
 * One party's address block.
 * @param props Component props.
 * @param props.title Block title ("From", "To").
 * @param props.party The party.
 * @returns The address block.
 */
const Party = (props: { title: string; party: InvoiceParty }) => {
  const t = useTranslations('InvoicePage');

  return (
    <div className="flex flex-col gap-0.5 text-[0.9375rem] text-ink-700">
      <h3 className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-600 uppercase">
        {props.title}
      </h3>
      <p className="font-semibold text-ink-950">{props.party.name}</p>
      <p>{props.party.street}</p>
      <p>{props.party.city}</p>
      <p>{t('email', { email: props.party.email })}</p>
      <p>{t('phone', { phone: props.party.phone })}</p>
    </div>
  );
};

/**
 * The Vue invoice: seller, customer and payment details, the lines, and the totals with a
 * payment button. Prints on its own, without the app shell or the buttons.
 * @returns The invoice card.
 */
export const InvoiceView = () => {
  const t = useTranslations('InvoicePage');
  const format = useFormatter();
  const totals = invoiceTotals(INVOICE);
  const money = (cents: number) =>
    format.number(cents / 100, { style: 'currency', currency: INVOICE.currency });

  return (
    <Card data-print-root className="gap-0 print:border-0 print:bg-ply print:shadow-none">
      <style>{PRINT_CSS}</style>
      <CardHeader className="border-b-[3px] border-double border-ink-300 pb-5 sm:grid-cols-[1fr_auto]">
        <CardTitle>
          <h2>
            {t.rich('invoice_title', {
              number: INVOICE.number,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </h2>
        </CardTitle>
        <div className="sm:col-start-2 sm:row-start-1">
          <InvoiceActions />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 pt-6">
        <div className="grid gap-6 sm:grid-cols-3 print:grid-cols-3">
          <Party title={t('from')} party={INVOICE.from} />
          <Party title={t('to')} party={INVOICE.to} />
          <div className="flex flex-col gap-0.5 text-[0.9375rem] text-ink-700">
            <h3 className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-600 uppercase">
              {t('details')}
            </h3>
            <p>
              {t.rich('invoice_number', {
                number: INVOICE.number,
                strong: (chunks) => <strong className="text-ink-950">{chunks}</strong>,
              })}
            </p>
            <p>
              <time dateTime={INVOICE.issuedOn}>
                {format.dateTime(new Date(`${INVOICE.issuedOn}T00:00:00Z`), {
                  dateStyle: 'long',
                  timeZone: 'UTC',
                })}
              </time>
            </p>
            <p>{t('vat_number', { vat: INVOICE.vatNumber })}</p>
            <p>{t('account_name', { name: INVOICE.accountName })}</p>
            <p className="font-semibold text-ink-950">{t('swift', { swift: INVOICE.swift })}</p>
          </div>
        </div>

        <Table className="[&_tbody>tr:nth-child(odd)]:bg-ink-100/45">
          <caption className="sr-only">{t('lines_caption')}</caption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">{t('column_index')}</TableHead>
              <TableHead>{t('column_item')}</TableHead>
              <TableHead className="hidden sm:table-cell print:table-cell">
                {t('column_description')}
              </TableHead>
              <TableHead className="text-center">{t('column_quantity')}</TableHead>
              <TableHead className="hidden text-right sm:table-cell print:table-cell">
                {t('column_unit_cost')}
              </TableHead>
              <TableHead className="text-right">{t('column_total')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICE.lines.map((line, index) => (
              <TableRow key={line.item} className="hover:bg-transparent">
                <TableCell className="text-center tabular-nums">{index + 1}</TableCell>
                <TableCell className="whitespace-normal">
                  <span className="font-semibold text-ink-950">{line.item}</span>
                  <span className="block text-xs text-ink-600 sm:hidden print:hidden">
                    {line.description}
                  </span>
                </TableCell>
                <TableCell className="hidden whitespace-normal text-ink-700 sm:table-cell print:table-cell">
                  {line.description}
                </TableCell>
                <TableCell className="text-center tabular-nums">{line.quantity}</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell print:table-cell">
                  {money(line.unitCents)}
                </TableCell>
                <TableCell className="text-right font-semibold text-ink-950 tabular-nums">
                  {money(line.quantity * line.unitCents)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] print:grid-cols-[minmax(0,1fr)_20rem]">
          <p className="max-w-prose text-[0.9375rem] text-ink-600">{t('terms')}</p>
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-[1fr_auto] items-baseline text-[0.9375rem] [&>dd]:border-b [&>dd]:border-ink-200 [&>dd]:py-2.5 [&>dd]:pl-6 [&>dd]:text-right [&>dd]:tabular-nums [&>dt]:border-b [&>dt]:border-ink-200 [&>dt]:py-2.5 [&>dt]:font-semibold">
              <dt>{t('subtotal')}</dt>
              <dd>{money(totals.subtotal)}</dd>
              <dt>{t('discount', { rate: INVOICE.discountRate })}</dt>
              <dd>{money(totals.discount)}</dd>
              <dt>{t('vat', { rate: INVOICE.vatRate })}</dt>
              <dd>{money(totals.vat)}</dd>
              <dt className="border-b-0! text-ink-950">{t('total')}</dt>
              <dd className="border-b-0! text-lg font-bold text-ink-950">{money(totals.total)}</dd>
            </dl>
            <PaymentButton />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
