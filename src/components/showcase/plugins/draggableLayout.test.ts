import { describe, expect, it } from 'vitest';
import { BASE_LAYOUT } from './data';
import { moveCard, parseStoredLayout, toggleCardSize } from './draggableLayout';

const ids = (layout: readonly { id: string }[]) => layout.map((card) => card.id);

describe(moveCard, () => {
  it('moves a card to the place of the card it is dropped on', () => {
    expect(ids(moveCard(BASE_LAYOUT, '1', '4'))).toStrictEqual(['3', '2', '4', '1', '5', '6']);
  });

  it('keeps the pinned card in place while the others flow around it', () => {
    const moved = moveCard(BASE_LAYOUT, '6', '1');

    expect(ids(moved)).toStrictEqual(['6', '2', '1', '3', '4', '5']);
    expect(moved[1]?.pinned).toBeTruthy();
  });

  it('leaves the layout alone when the target is pinned or the same card', () => {
    expect(moveCard(BASE_LAYOUT, '1', '2')).toBe(BASE_LAYOUT);
    expect(moveCard(BASE_LAYOUT, '3', '3')).toBe(BASE_LAYOUT);
  });
});

describe(toggleCardSize, () => {
  it('flips only the chosen size of the chosen card', () => {
    const layout = toggleCardSize(BASE_LAYOUT, '5', 'wide');

    expect(layout.find((card) => card.id === '5')?.wide).toBeFalsy();
    expect(layout.find((card) => card.id === '5')?.tall).toBeFalsy();
    expect(layout.find((card) => card.id === '1')).toBe(BASE_LAYOUT[0]);
  });
});

describe(parseStoredLayout, () => {
  it('reads back a saved layout', () => {
    expect(parseStoredLayout(JSON.stringify(BASE_LAYOUT))).toStrictEqual(BASE_LAYOUT);
  });

  it('ignores missing, malformed or foreign data', () => {
    expect(parseStoredLayout(null)).toBeNull();
    expect(parseStoredLayout('{not json')).toBeNull();
    expect(parseStoredLayout('[{"i":"0","x":0,"y":0,"w":4,"h":16}]')).toBeNull();
    expect(parseStoredLayout('[]')).toBeNull();
  });
});
