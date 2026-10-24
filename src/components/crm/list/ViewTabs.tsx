import { cn } from 'cn';
import { Link } from '@/libs/I18nNavigation';

/**
 * A list's views (List · Board) as tabs under its title: links that keep the list's search and
 * filters, the current one marked and underlined in violet.
 * @param props Component props.
 * @param props.label What the tabs switch, such as "View".
 * @param props.tabs Each view: its label, its link, and whether it is the one shown.
 * @returns The tabs.
 */
export const ViewTabs = (props: {
  label: string;
  tabs: { key: string; label: string; href: string; current: boolean }[];
}) => (
  <nav aria-label={props.label} className="-mb-px flex gap-1">
    {props.tabs.map((tab) => (
      <Link
        key={tab.key}
        href={tab.href}
        aria-current={tab.current ? 'page' : undefined}
        scroll={false}
        className={cn(
          'flex h-9 items-center border-b-2 px-2 text-[0.8125rem] font-medium no-underline transition-colors duration-150',
          tab.current
            ? 'border-violet-ink text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        {tab.label}
      </Link>
    ))}
  </nav>
);
