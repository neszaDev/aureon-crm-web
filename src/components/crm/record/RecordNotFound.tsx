import { ArrowLeftIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CrmState } from '@/components/crm/CrmState';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * Shown in place of a record page (`CrmState`), inside the shell, when the record doesn't exist (404, or a
 * malformed id): deleted, from another workspace, or a wrong link. The page's metadata uses the
 * same title.
 * @param props Component props.
 * @param props.href The record's list.
 * @param props.backLabel The link's label, such as "Back to companies".
 * @returns The panel.
 */
export const RecordNotFound = (props: { href: string; backLabel: string }) => {
  const t = useTranslations('RecordNotFound');

  return (
    <CrmState
      icon={SearchXIcon}
      heading
      title={t('title')}
      text={t('text')}
      className="mx-auto w-full max-w-6xl py-6"
    >
      <Button asChild variant="outline">
        <Link href={props.href}>
          <ArrowLeftIcon data-icon="inline-start" />
          {props.backLabel}
        </Link>
      </Button>
    </CrmState>
  );
};
