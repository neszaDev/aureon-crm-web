/** How long after creation a row still counts as new, so its mark draws on. */
const FRESH_MS = 20_000;

/**
 * Picks the rows created moments ago, so the page can draw their marks on.
 * @param rows Results with their creation time.
 * @param now Current time in milliseconds.
 * @returns Draw delays (milliseconds) keyed by row id.
 */
export const freshDrawDelays = (rows: { id?: number; createdAt?: string }[], now: number) =>
  new Map(
    rows
      .filter((row) => row.createdAt && now - new Date(row.createdAt).getTime() < FRESH_MS)
      .map((row, index) => [row.id, 150 + index * 150]),
  );
