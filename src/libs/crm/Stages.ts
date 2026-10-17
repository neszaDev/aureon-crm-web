import type { components } from '@/libs/api/schema';

/** A pipeline stage with the fields the settings use (the generated type has them optional). */
export type Stage = {
  id: number;
  name: string;
  probability: number;
  kind: 'OPEN' | 'WON' | 'LOST';
  version: number;
};

/**
 * Reads the backend's stages, keeping their order. Rows without an id or version (which the
 * backend never sends) are dropped.
 * @param rows The backend's stages.
 * @returns The stages.
 */
export const toStages = (rows: components['schemas']['StageResponse'][]): Stage[] =>
  rows.flatMap((row) =>
    row.id === undefined || row.version === undefined
      ? []
      : [
          {
            id: row.id,
            name: row.name ?? '',
            probability: row.probability ?? 0,
            kind: row.kind ?? 'OPEN',
            version: row.version,
          },
        ],
  );
