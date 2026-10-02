import * as z from 'zod';
import type { GridCard } from './data';

/**
 * Moves a card to another card's place. Pinned cards keep their position; the movable cards
 * flow around them.
 * @param layout Cards in display order.
 * @param activeId Id of the card being moved.
 * @param overId Id of the card it was dropped on.
 * @returns The new layout (the same array when nothing moves).
 */
export const moveCard = (layout: readonly GridCard[], activeId: string, overId: string) => {
  const movable = layout.filter((card) => !card.pinned);
  const from = movable.findIndex((card) => card.id === activeId);
  const to = movable.findIndex((card) => card.id === overId);
  if (from === -1 || to === -1 || from === to) {
    return layout;
  }

  const reordered = [...movable];
  const [moved] = reordered.splice(from, 1);
  if (!moved) {
    return layout;
  }
  reordered.splice(to, 0, moved);

  let next = 0;
  return layout.map((card) => {
    if (card.pinned) {
      return card;
    }
    const placed = reordered[next] ?? card;
    next += 1;
    return placed;
  });
};

/**
 * Flips one size of a card: two columns wide, or taller than the rest.
 * @param layout Cards in display order.
 * @param id Id of the card to resize.
 * @param dimension Which size to flip.
 * @returns The new layout.
 */
export const toggleCardSize = (
  layout: readonly GridCard[],
  id: string,
  dimension: 'wide' | 'tall',
) => layout.map((card) => (card.id === id ? { ...card, [dimension]: !card[dimension] } : card));

const storedLayoutSchema = z
  .array(
    z.object({
      id: z.string(),
      accent: z.enum(['folder', 'ink-950', 'ink-700', 'ink-600', 'ink-400', 'ink-300']),
      wide: z.boolean(),
      tall: z.boolean(),
      pinned: z.boolean(),
    }),
  )
  .min(1);

/**
 * Reads a layout saved as JSON; anything malformed counts as no saved layout.
 * @param raw The stored JSON, if any.
 * @returns The layout, or `null`.
 */
export const parseStoredLayout = (raw: string | null): GridCard[] | null => {
  if (!raw) {
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = storedLayoutSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
};
