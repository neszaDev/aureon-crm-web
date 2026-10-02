import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Searches users by part of their email. A plain GET form: the query lands in `?q=`, so a
 * search can be linked, reloaded and paged without client code.
 * @param props Component props.
 * @param props.query The current search.
 * @returns The search form.
 */
export const UserSearchForm = (props: { query: string }) => {
  const t = useTranslations('UsersPage');

  return (
    <search>
      <form className="flex flex-col gap-2 sm:max-w-md">
        <Label htmlFor="user-search">{t('search_label')}</Label>
        <div className="flex gap-2">
          <Input
            id="user-search"
            name="q"
            type="search"
            defaultValue={props.query}
            maxLength={254}
            autoComplete="off"
            placeholder={t('search_placeholder')}
          />
          <Button type="submit" variant="outline">
            <SearchIcon data-icon="inline-start" />
            {t('search_button')}
          </Button>
        </div>
      </form>
    </search>
  );
};
