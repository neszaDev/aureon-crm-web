import { ExternalLinkIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

/**
 * Records that look like the one being entered, as a hint that never blocks saving. Each opens
 * in a new tab, so the form keeps what was typed.
 * @param props Component props.
 * @param props.items The look-alikes: a label, a detail (website, email) and the record's page.
 * @returns A live region, and the warning when there are look-alikes.
 */
export const DuplicateWarning = (props: {
  items: { id: number; label: string; detail?: string; href: string }[];
}) => {
  const t = useTranslations('DuplicateWarning');
  const title = t('title', { count: props.items.length });

  return (
    <>
      {/* Always there, so screen readers announce the look-alikes as they appear; sr-only is
          positioned out of the form's flow, so the empty region adds no gap. */}
      <p aria-live="polite" className="sr-only">
        {props.items.length > 0 && title}
      </p>
      {props.items.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-md border border-rule bg-field px-3.5 py-3 text-sm">
          <TriangleAlertIcon aria-hidden="true" className="mt-px size-4 shrink-0 text-warning" />
          <div className="flex min-w-0 flex-col gap-1.5">
            {/* Read once, from the live region above. */}
            <p aria-hidden="true" className="font-medium">
              {title}
            </p>
            <ul className="flex flex-col gap-1">
              {props.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-violet-ink"
                  >
                    {item.label}
                    <span className="sr-only"> {t('new_tab')}</span>
                    <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
                  </Link>
                  {item.detail && (
                    <span className="break-all text-muted-foreground">{item.detail}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">{t('text')}</p>
          </div>
        </div>
      )}
    </>
  );
};
