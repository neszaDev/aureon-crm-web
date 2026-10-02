'use client';

import { CreditCardIcon, PrinterIcon, SaveIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

/**
 * The invoice header buttons: save (confirmed with a toast) and print (the browser's print
 * dialog, which prints only the invoice). Hidden on paper.
 * @returns The buttons and the toaster they report to.
 */
export const InvoiceActions = () => {
  const t = useTranslations('InvoicePage');

  return (
    <div className="flex gap-2 print:hidden">
      <Button type="button" variant="outline" size="sm" onClick={() => toast.success(t('saved'))}>
        <SaveIcon data-icon="inline-start" />
        {t('save')}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          window.print();
        }}
      >
        <PrinterIcon data-icon="inline-start" />
        {t('print')}
      </Button>
      <Toaster position="bottom-right" />
    </div>
  );
};

/**
 * The "Proceed to payment" button. Payments are not connected, so it says so in a toast.
 * @returns The button.
 */
export const PaymentButton = () => {
  const t = useTranslations('InvoicePage');

  return (
    <Button
      type="button"
      className="print:hidden"
      onClick={() => toast.info(t('payment_unavailable'))}
    >
      <CreditCardIcon data-icon="inline-start" />
      {t('pay')}
    </Button>
  );
};
