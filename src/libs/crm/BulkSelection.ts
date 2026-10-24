/** The records a list selects for a bulk action. */
export type BulkEntity = 'company' | 'contact' | 'lead' | 'deal' | 'task';

/** What a bulk action needs of a selected row. */
export type BulkItem = {
  id: number;
  name: string;
  /** The version the list read; companies and contacts are listed without one. */
  version?: number;
  /** Its owner (a task's assignee), if any. */
  ownerId?: number;
  /** Whether the caller may change it (`canEditRecord`). */
  mayEdit: boolean;
  /** Where it stands: a lead's or task's status, or a deal's stage id. */
  state?: string;
};

/**
 * A list's selection: the rows chosen, the row a range starts from (the last one toggled), and the
 * list state it belongs to (its URL query: group, filters, sort and page).
 */
export type Selection = { scope: string; keys: ReadonlySet<number>; anchor?: number };

/**
 * Nothing selected.
 * @param scope The list state.
 * @returns The empty selection.
 */
export const emptySelection = (scope: string): Selection => ({ scope, keys: new Set() });

/**
 * Selects a row, or takes it out; it becomes the anchor of the next range.
 * @param selection The selection.
 * @param id The row.
 * @returns The new selection.
 */
export const toggle = (selection: Selection, id: number): Selection => {
  const keys = new Set(selection.keys);
  if (!keys.delete(id)) {
    keys.add(id);
  }

  return { ...selection, keys, anchor: id };
};

/**
 * Shift+click: sets every row of the section from the anchor to `id` to what `id` toggles to
 * (selected, or taken out when it was in). Without an anchor in the section, it toggles `id`.
 * @param selection The selection.
 * @param ids The section's rows, in order.
 * @param id The row clicked.
 * @returns The new selection.
 */
export const selectRange = (selection: Selection, ids: number[], id: number): Selection => {
  const from = selection.anchor === undefined ? -1 : ids.indexOf(selection.anchor);
  const to = ids.indexOf(id);
  if (from < 0 || to === -1) {
    return toggle(selection, id);
  }
  const on = !selection.keys.has(id);
  const keys = new Set(selection.keys);
  for (const item of ids.slice(Math.min(from, to), Math.max(from, to) + 1)) {
    if (on) {
      keys.add(item);
    } else {
      keys.delete(item);
    }
  }

  return { ...selection, keys, anchor: id };
};

/**
 * A section's select-all box: none, some (mixed) or all of its rows selected.
 * @param keys The rows selected.
 * @param ids The section's rows.
 * @returns The box's state, as the checkbox takes it.
 */
export const sectionState = (keys: ReadonlySet<number>, ids: number[]) => {
  const count = ids.filter((id) => keys.has(id)).length;
  if (count === 0) {
    return false;
  }

  return count === ids.length ? true : 'indeterminate';
};

/**
 * The select-all box: selects the whole section, or takes it out once all of it is in.
 * @param selection The selection.
 * @param ids The section's rows.
 * @returns The new selection.
 */
export const toggleSection = (selection: Selection, ids: number[]): Selection => {
  const all = sectionState(selection.keys, ids) === true;
  const keys = new Set(selection.keys);
  for (const id of ids) {
    if (all) {
      keys.delete(id);
    } else {
      keys.add(id);
    }
  }

  return { ...selection, keys };
};

/**
 * The selection for the list as now drawn: empty for another list state, else only the rows still
 * on screen (a refresh drops the rows that left).
 * @param selection The selection kept.
 * @param scope The list's state now.
 * @param present The rows now on screen.
 * @returns The live selection.
 */
export const liveSelection = (
  selection: Selection,
  scope: string,
  present: number[],
): Selection => {
  if (selection.scope !== scope) {
    return emptySelection(scope);
  }
  const shown = new Set(present);

  return {
    scope,
    keys: new Set([...selection.keys].filter((id) => shown.has(id))),
    anchor:
      selection.anchor !== undefined && shown.has(selection.anchor) ? selection.anchor : undefined,
  };
};

/**
 * Runs `work` on every item, at most `limit` at once, and gives the results in the items' order.
 * @param items The items.
 * @param limit How many run at once.
 * @param work What to do with one.
 * @param onSettled Called as each one finishes.
 * @returns The results.
 */
export const runPooled = async <T, R>(
  items: T[],
  limit: number,
  work: (item: T) => Promise<R>,
  onSettled?: () => void,
) => {
  const results: R[] = [];
  // One queue for every worker: each takes the next item as it frees up.
  const queue = items.entries();
  const worker = async (): Promise<void> => {
    const next = queue.next();
    if (next.done) {
      return;
    }
    const [index, item] = next.value;
    results[index] = await work(item);
    onSettled?.();
    await worker();
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));

  return results;
};

/**
 * What a bulk action may do to every selected record: assign (with `RECORDS_ASSIGN`) and change
 * the status (leads and deals; tasks: complete and cancel open ones, reopen closed ones) while
 * none is locked, converted or archived; archive, or in the archive restore (not tasks), while none
 * is locked. A record the caller may not change is locked; a converted lead only archives.
 * @param entity The records' kind.
 * @param chosen The records selected.
 * @param options The caller's right to assign, and whether the list is the archive.
 * @param options.mayAssign Whether the caller may give records to others.
 * @param options.archived Whether the list is the archive.
 * @returns How many are locked and converted, and what may be done.
 */
export const bulkActions = (
  entity: BulkEntity,
  chosen: BulkItem[],
  options: { mayAssign: boolean; archived: boolean },
) => {
  const locked = chosen.filter((item) => !item.mayEdit).length;
  const converted = chosen.filter((item) => entity === 'lead' && item.state === 'CONVERTED').length;
  const active = locked === 0 && converted === 0 && !options.archived;
  const open = entity === 'task' && chosen.every((item) => item.state === 'OPEN');
  const closed = entity === 'task' && chosen.every((item) => item.state !== 'OPEN');
  const archives = locked === 0 && entity !== 'task';

  return {
    locked,
    converted,
    assign: active && options.mayAssign,
    status: active && (entity === 'lead' || entity === 'deal' || open || closed),
    /** Tasks: complete or cancel (all open), reopen (all closed). */
    open: active && open,
    closed: active && closed,
    archive: archives && !options.archived,
    restore: archives && options.archived,
  };
};
