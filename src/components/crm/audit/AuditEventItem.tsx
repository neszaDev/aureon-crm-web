import { cn } from 'cn';
import { useLocale, useTranslations } from 'next-intl';
import { Seal } from '@/components/crm/Seal';
import type { components } from '@/libs/api/schema';
import {
  formatAmount,
  formatDate,
  formatInstant,
  formatMoney,
  recordNumber,
} from '@/libs/crm/Format';
import { isDate } from '@/libs/crm/ListQuery';
import { Link } from '@/libs/I18nNavigation';

type Event = components['schemas']['AuditEventResponse'];
type Workspace = Pick<components['schemas']['WorkspaceResponse'], 'id' | 'timezone'>;
type EntityType = Event['entityType'];

// The records that have a page, and their number's letter.
const RECORD_PAGES: Partial<
  Record<EntityType, { path: string; kind: Parameters<typeof recordNumber>[0] }>
> = {
  COMPANY: { path: 'companies', kind: 'company' },
  CONTACT: { path: 'contacts', kind: 'contact' },
  LEAD: { path: 'leads', kind: 'lead' },
  DEAL: { path: 'deals', kind: 'deal' },
  TASK: { path: 'tasks', kind: 'task' },
};

// The fields the history names, which have a translated label (`field_<name>`); any other is
// written in sentence case from its name.
const FIELDS = [
  'name',
  'firstName',
  'lastName',
  'email',
  'phone',
  'jobTitle',
  'company',
  'companyName',
  'contact',
  'lead',
  'deal',
  'owner',
  'assignee',
  'author',
  'createdBy',
  'source',
  'notes',
  'description',
  'status',
  'priority',
  'currency',
  'amount',
  'estimatedValue',
  'probability',
  'probabilityOverride',
  'stage',
  'tags',
  'address',
  'industry',
  'website',
  'employeeCount',
  'expectedCloseDate',
  'followUpDate',
  'closedAt',
  'completedAt',
  'dueAt',
  'convertedAt',
  'convertedCompany',
  'convertedContact',
  'convertedDeal',
  'unqualifiedReason',
  'lostReason',
  'archivedAt',
  'stageEnteredAt',
  'occurredAt',
  'subject',
  'body',
  'type',
  'title',
  'linkedActivities',
  'linkedTasks',
  'role',
  'defaultCurrency',
  'timezone',
  'list',
  'filters',
  'kind',
  'position',
  'archived',
] as const;
// A label that differs for one kind of record (`field_<TYPE>_<name>`).
const TYPED_FIELDS = ['ACTIVITY_occurredAt', 'DEAL_name'] as const;
// The fields whose values are words from a fixed list, translated (`value_<VALUE>`).
const WORD_FIELDS = new Set(['status', 'priority', 'type', 'role', 'kind']);
const WORDS = [
  'OPEN',
  'WON',
  'LOST',
  'COMPLETED',
  'CANCELLED',
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'UNQUALIFIED',
  'CONVERTED',
  'LOW',
  'MEDIUM',
  'HIGH',
  'CALL',
  'EMAIL',
  'MEETING',
  'NOTE',
  'OWNER',
  'ADMIN',
  'MANAGER',
  'SALES_REP',
] as const;
const MONEY_FIELDS = new Set(['amount', 'estimatedValue']);
// What names a record or a person in the history, in the order to try.
const NAME_KEYS = ['displayName', 'fullName', 'name', 'email'] as const;
// The record's own id says nothing in a list of changes.
const SKIPPED_FIELDS = new Set(['id']);
const SHORT_LINES = 2;
const TEXT_LIMIT = 80;

/**
 * Tells whether a value is one of a fixed list.
 * @param list The list.
 * @param value The value.
 * @returns Whether it is in the list, narrowing it to the list's values.
 */
const isOneOf = <T extends string>(list: readonly T[], value: string): value is T =>
  list.some((item) => item === value);

/**
 * A field's name in sentence case, from the API's camelCase: `mainContactPerson` is "Main
 * contact person".
 * @param field The field's name.
 * @returns The words.
 */
const humanise = (field: string) => {
  const words = field.replaceAll(/([a-z\d])([A-Z])/gu, '$1 $2').toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * What names a record or a person in a change: `{ id, name }`, `{ id, fullName }` or a member.
 * @param value A change's value that is an object.
 * @returns The name, if it has one.
 */
const nameOf = (value: object) =>
  NAME_KEYS.map((key): unknown => Reflect.get(value, key)).find(
    (name): name is string => typeof name === 'string' && name !== '',
  );

/**
 * One side of a change.
 * @param value The change, from the event's `changes`.
 * @param side Which side.
 * @returns The value, or undefined for a field that was not there.
 */
const sideOf = (value: unknown, side: 'from' | 'to'): unknown =>
  typeof value === 'object' && value !== null ? Reflect.get(value, side) : undefined;

/**
 * One entry of the history: who did what to which record, when (in the workspace's time zone),
 * and what changed. The actor signs it with their own seal, or it says "Former member" without
 * one. The record is a link to its page (a deleted one and an activity have none). An update
 * lists its changed fields as "Field: from → to": money with its currency when the event names
 * it (never a guess), days and instants as dates in the workspace's zone, a member or a record by
 * name, words from a fixed list translated, an id as "changed". A deletion lists the last state;
 * an export shows its label. Put it in a `ul`.
 * @param props Component props.
 * @param props.event The audit event (the dashboard's `recentChanges`, a record's history).
 * @param props.workspace The workspace: its id, for the links, and its time zone.
 * @param props.compact Two changed fields at most, the rest counted (the dashboard's).
 * @param props.ownPage It shows on the record's own page (its history): the record is neither a
 *   link to that page nor numbered again under the page's header.
 * @returns The list item.
 */
export const AuditEventItem = (props: {
  event: Event;
  workspace: Workspace;
  compact?: boolean;
  ownPage?: boolean;
}) => {
  const t = useTranslations('AuditEventItem');
  const locale = useLocale();
  const { event } = props;
  const record = props.ownPage ? undefined : RECORD_PAGES[event.entityType];
  const actorName = event.actor?.displayName ?? event.actor?.email;
  const changes: Record<string, unknown> = event.changes;

  // A text or a name held to 80 characters, cut between characters as the language writes them
  // (Thai marks stay with their letters), so nothing floods the list.
  const cut = (text: string) => {
    const characters = [...new Intl.Segmenter(locale).segment(text)];

    return characters.length > TEXT_LIMIT
      ? `${characters
          .slice(0, TEXT_LIMIT - 1)
          .map((character) => character.segment)
          .join('')}…`
      : text;
  };
  const label = (field: string) => {
    const typed = `${event.entityType}_${field}`;
    if (isOneOf(TYPED_FIELDS, typed)) {
      return t(`field_${typed}`);
    }

    return isOneOf(FIELDS, field) ? t(`field_${field}`) : humanise(field);
  };
  // The currency a money field of the event was in, when the event itself says (a change of
  // currency carries both); never a guess from anywhere else.
  const currencyAt = (side: 'from' | 'to') => {
    const currency = sideOf(changes.currency, side);

    return typeof currency === 'string' ? currency : undefined;
  };
  // One side of a change as text; undefined when it can't be read (an id, an object without a
  // name), which makes the whole field read "changed".
  const show = (field: string, value: unknown, currency?: string): string | undefined => {
    if (value === null || value === undefined) {
      return t('value_none');
    }
    if (typeof value === 'boolean') {
      return t(value ? 'value_yes' : 'value_no');
    }
    if (typeof value === 'number') {
      return /[a-z]Id$/u.test(field) ? undefined : new Intl.NumberFormat(locale).format(value);
    }
    if (Array.isArray(value)) {
      return value.length === 0
        ? t('value_none')
        : value.map((item) => show(field, item, currency) ?? t('value_changed')).join(', ');
    }
    if (typeof value === 'object') {
      const name = nameOf(value);

      return name === undefined ? undefined : cut(name);
    }
    if (typeof value !== 'string') {
      return undefined;
    }
    if (MONEY_FIELDS.has(field)) {
      return currency ? formatMoney(value, currency, locale) : formatAmount(value, locale);
    }
    if (isDate(value)) {
      return formatDate(value, locale);
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/u.test(value) && !Number.isNaN(Date.parse(value))) {
      return formatInstant(value, {
        locale,
        timeZone: props.workspace.timezone,
        withTime: true,
      });
    }
    if (WORD_FIELDS.has(field) && isOneOf(WORDS, value)) {
      return t(`value_${value}`);
    }

    return cut(value);
  };

  const fields = Object.entries(changes).filter(([field]) => !SKIPPED_FIELDS.has(field));
  let lines: { field: string; text: string }[] = [];
  if (event.action === 'DELETE') {
    // What the record was: every field it had, as the `from` of a change.
    lines = fields.flatMap(([field, change]) => {
      const value = show(field, sideOf(change, 'from'), currencyAt('from'));

      return sideOf(change, 'from') === null ||
        sideOf(change, 'from') === undefined ||
        value === undefined
        ? []
        : [{ field, text: t('state', { field: label(field), value }) }];
    });
  } else if (event.action !== 'EXPORT') {
    lines = fields.map(([field, change]) => {
      const from = show(field, sideOf(change, 'from'), currencyAt('from'));
      const to = show(field, sideOf(change, 'to'), currencyAt('to'));

      return {
        field,
        text:
          from === undefined || to === undefined
            ? t('change_unreadable', { field: label(field) })
            : t('change', { field: label(field), from, to }),
      };
    });
  }
  const shown = props.compact ? lines.slice(0, SHORT_LINES) : lines;
  const shownLabel =
    event.entityLabel === undefined ? t(`entity_${event.entityType}`) : cut(event.entityLabel);
  // The whole name, when the cut shortened it.
  const fullLabel = shownLabel === event.entityLabel ? undefined : event.entityLabel;
  // A deleted record has no page to go to.
  const href =
    record && event.action !== 'DELETE'
      ? `/app/${props.workspace.id}/${record.path}/${event.entityId}`
      : undefined;

  return (
    <li className="flex items-start gap-3 border-t border-rule px-4 py-3 sm:px-5">
      {actorName && event.actor ? (
        <Seal name={event.actor.displayName} email={event.actor.email ?? ''} size="sm" />
      ) : (
        // Nobody signs it: a seal is only ever someone's.
        <span aria-hidden="true" className="size-6 shrink-0" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[0.9375rem] break-words">
          {t.rich(`phrase_${event.action}`, {
            actor: actorName === undefined ? t('former_member') : cut(actorName),
            record: shownLabel,
            who: (chunks) => <strong className="font-semibold">{chunks}</strong>,
            what: (chunks) => (
              <>
                {href ? (
                  <Link
                    href={href}
                    title={fullLabel}
                    className="font-medium break-words text-foreground"
                  >
                    {chunks}
                  </Link>
                ) : (
                  <span title={fullLabel} className="font-medium">
                    {chunks}
                  </span>
                )}
                {record && (
                  <span className="ml-1.5 font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                    {recordNumber(record.kind, event.entityId)}
                  </span>
                )}
              </>
            ),
          })}
        </p>
        {event.action === 'EXPORT' && event.entityLabel && (
          <p className="text-sm break-words text-muted-foreground">{event.entityLabel}</p>
        )}
        {shown.length > 0 && (
          <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
            {shown.map((line) => (
              <li key={line.field} className={cn('break-words', props.compact && 'line-clamp-2')}>
                {line.text}
              </li>
            ))}
          </ul>
        )}
        {shown.length < lines.length && (
          <p className="text-sm text-muted-foreground">
            {t('more_changes', { count: lines.length - shown.length })}
          </p>
        )}
        <time
          dateTime={event.occurredAt}
          className="text-[0.8125rem] text-muted-foreground tabular-nums"
        >
          {formatInstant(event.occurredAt, {
            locale,
            timeZone: props.workspace.timezone,
            withTime: true,
          })}
        </time>
      </div>
    </li>
  );
};
