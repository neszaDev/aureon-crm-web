import { TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

/**
 * Shown in place of a list when the backend refuses its query (400): filters that can't go
 * together, from a hand-edited or outdated link. It offers the list without them. A page that is no
 * list says what it refused in its own words (`messages`).
 * @param props Component props.
 * @param props.resetHref The list without search, filters or sort.
 * @param props.messages The title, text and link's label, in place of the list's.
 * @returns The notice.
 */
export const InvalidFilterNotice = (props: {
  resetHref: string;
  messages?: { title: string; text: string; reset: string };
}) => {
  const t = useTranslations('RecordList');
  const messages = props.messages ?? {
    title: t('invalid_title'),
    text: t('invalid_text'),
    reset: t('invalid_reset'),
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rule bg-card p-5">
      <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">{messages.title}</h2>
        <p className="text-muted-foreground">{messages.text}</p>
        <Link href={props.resetHref} className="mt-1 w-fit font-medium text-violet-ink">
          {messages.reset}
        </Link>
      </div>
    </div>
  );
};
