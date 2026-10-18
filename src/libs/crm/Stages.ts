import type { components } from '@/libs/api/schema';

/** A pipeline stage with the fields the settings use. */
export type Stage = {
  id: number;
  name: string;
  probability: number;
  kind: 'OPEN' | 'WON' | 'LOST';
  version: number;
};

/**
 * Keeps the fields the settings use of the backend's stages, in their order.
 * @param rows The backend's stages.
 * @returns The stages.
 */
export const toStages = (rows: components['schemas']['StageResponse'][]): Stage[] =>
  rows.map((row) => ({
    id: row.id,
    name: row.name,
    probability: row.probability,
    kind: row.kind,
    version: row.version,
  }));
