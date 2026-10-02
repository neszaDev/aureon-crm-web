import { useTranslations } from 'next-intl';
import { Pagination } from '@/components/Pagination';
import { CopyNameTile } from './CopyNameTile';
import { IconSearch } from './IconSearch';

/**
 * A searchable, paged grid of icons with copyable names. Filtering happens on the server
 * from `?q=` (see `searchNames`), so only one page of SVG is ever sent.
 * @param props Component props.
 * @param props.items The icons on this page, each with its name.
 * @param props.query The current search text.
 * @param props.total Number of icons that match.
 * @param props.page Zero-based current page.
 * @param props.totalPages Number of pages.
 * @param props.path The gallery's path, for the page links.
 * @returns The gallery.
 */
export const IconGallery = (props: {
  items: { name: string; icon: React.ReactNode }[];
  query: string;
  total: number;
  page: number;
  totalPages: number;
  path: string;
}) => {
  const t = useTranslations('IconGallery');
  const href = (page: number) => {
    const search = new URLSearchParams({ ...(props.query && { q: props.query }), page: `${page}` });
    return `${props.path}?${search.toString()}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <IconSearch defaultValue={props.query} />
        <p className="text-sm text-ink-600 tabular-nums" aria-live="polite">
          {props.query
            ? t('matches', { total: props.total, query: props.query })
            : t('count', { total: props.total })}
        </p>
      </div>

      {props.items.length > 0 ? (
        <ul className="-mx-2 grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
          {props.items.map((item) => (
            <CopyNameTile key={item.name} name={item.name}>
              {item.icon}
            </CopyNameTile>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-[0.9375rem] text-ink-600">
          {t('empty', { query: props.query })}
        </p>
      )}

      {props.totalPages > 1 && (
        <div className="-mx-5 -mb-5">
          <Pagination page={props.page} totalPages={props.totalPages} href={href} />
        </div>
      )}
    </div>
  );
};
