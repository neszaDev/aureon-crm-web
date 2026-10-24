import { describe, expect, it } from 'vitest';
import {
  bulkActions,
  emptySelection,
  liveSelection,
  runPooled,
  sectionState,
  selectRange,
  toggle,
  toggleSection,
} from './BulkSelection';

const ROWS = [11, 12, 13, 14, 15];
const item = (state: string, mayEdit = true) => ({ id: 1, name: 'A', mayEdit, state });
const keysOf = (selection: { keys: ReadonlySet<number> }) =>
  [...selection.keys].toSorted((a, b) => a - b);

describe(toggle, () => {
  it('adds a row, then takes it out, and makes it the anchor', () => {
    const once = toggle(emptySelection('a'), 12);

    expect(keysOf(once)).toStrictEqual([12]);
    expect(once.anchor).toBe(12);
    expect(keysOf(toggle(once, 12))).toStrictEqual([]);
  });
});

describe(selectRange, () => {
  it('selects every row from the anchor to the one clicked, either way', () => {
    const down = selectRange(toggle(emptySelection('a'), 12), ROWS, 14);
    const up = selectRange(toggle(emptySelection('a'), 14), ROWS, 11);

    expect(keysOf(down)).toStrictEqual([12, 13, 14]);
    expect(keysOf(up)).toStrictEqual([11, 12, 13, 14]);
    expect(down.anchor).toBe(14);
  });

  it('takes the range out when the row clicked was selected', () => {
    const all = toggleSection(emptySelection('a'), ROWS);
    const anchored = { ...all, anchor: 12 };

    expect(keysOf(selectRange(anchored, ROWS, 14))).toStrictEqual([11, 15]);
  });

  it('toggles the row alone without an anchor in its section', () => {
    const other = toggle(emptySelection('a'), 99);

    expect(keysOf(selectRange(other, ROWS, 13))).toStrictEqual([13, 99]);
    expect(keysOf(selectRange(emptySelection('a'), ROWS, 13))).toStrictEqual([13]);
  });
});

describe(sectionState, () => {
  it('is false, mixed or true as none, some or all of the section is selected', () => {
    const states = [new Set<number>(), new Set([12, 99]), new Set(ROWS)].map((keys) =>
      sectionState(keys, ROWS),
    );

    expect(states).toStrictEqual([false, 'indeterminate', true]);
    expect([sectionState(new Set([1]), [])]).toStrictEqual([false]);
  });
});

describe(toggleSection, () => {
  it('selects the whole section, keeping other sections, then clears it once all are in', () => {
    const some = toggle(toggle(emptySelection('a'), 12), 99);
    const all = toggleSection(some, ROWS);

    expect(keysOf(all)).toStrictEqual([11, 12, 13, 14, 15, 99]);
    expect(keysOf(toggleSection(all, ROWS))).toStrictEqual([99]);
  });
});

describe(liveSelection, () => {
  it('keeps only the rows still there after a refresh', () => {
    const chosen = toggleSection(emptySelection('a'), ROWS);
    const live = liveSelection({ ...chosen, anchor: 15 }, 'a', [11, 13]);

    expect(keysOf(live)).toStrictEqual([11, 13]);
    expect(live.anchor).toBeUndefined();
  });

  it('clears for another list state: a new group, filter, sort or page', () => {
    const chosen = toggleSection(emptySelection('a'), ROWS);
    const live = liveSelection(chosen, 'b', ROWS);

    expect(keysOf(live)).toStrictEqual([]);
    expect(live.scope).toBe('b');
  });
});

describe(runPooled, () => {
  it('runs at most the limit at once, and gives the results in order', async () => {
    const waits = Array.from({ length: 7 }, () => Promise.withResolvers<boolean>());
    let running = 0;
    let most = 0;
    let settled = 0;
    const done = runPooled(
      [0, 1, 2, 3, 4, 5, 6],
      4,
      async (index) => {
        running += 1;
        most = Math.max(most, running);
        await waits[index]?.promise;
        running -= 1;
        return index * 10;
      },
      () => {
        settled += 1;
      },
    );
    // Out of order, as answers come.
    for (const index of [3, 0, 6, 1, 5, 2, 4]) {
      waits[index]?.resolve(true);
    }

    await expect(done).resolves.toStrictEqual([0, 10, 20, 30, 40, 50, 60]);
    expect(most).toBe(4);
    expect(settled).toBe(7);
  });
});

describe(bulkActions, () => {
  it('offers nothing but clear while one record is locked', () => {
    expect(
      bulkActions('deal', [item('1'), item('1', false)], { mayAssign: true, archived: false }),
    ).toMatchObject({ locked: 1, assign: false, status: false, archive: false, restore: false });
  });

  it('keeps converted leads to archive alone, and tasks to the moves all of them take', () => {
    expect(
      bulkActions('lead', [item('CONVERTED'), item('NEW')], { mayAssign: true, archived: false }),
    ).toMatchObject({ converted: 1, assign: false, status: false, archive: true });
    expect(
      bulkActions('task', [item('OPEN'), item('COMPLETED')], { mayAssign: true, archived: false }),
    ).toMatchObject({ status: false, open: false, closed: false, archive: false });
    expect(
      bulkActions('task', [item('CANCELLED')], { mayAssign: false, archived: false }),
    ).toMatchObject({ assign: false, status: true, open: false, closed: true });
  });

  it('offers only restore in the archive', () => {
    expect(bulkActions('company', [item('')], { mayAssign: true, archived: true })).toMatchObject({
      assign: false,
      status: false,
      archive: false,
      restore: true,
    });
  });
});
