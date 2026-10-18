/**
 * Turns a `[workspaceId]` route segment into an id, so a malformed URL is "not found" without
 * asking the backend. Only the canonical form passes (no zero, no leading zeros), so each
 * workspace has one URL; 15 digits always fit a JavaScript number.
 * @param segment The route segment.
 * @returns The id, or undefined.
 */
export const toWorkspaceId = (segment: string) =>
  /^[1-9]\d{0,14}$/u.test(segment) ? Number(segment) : undefined;

/**
 * Turns a record's route segment (`[id]`) or an id in a list's query into an id, by the same
 * rules as `toWorkspaceId`: a malformed one is "not found" without asking the backend.
 * @param segment The route segment or query value.
 * @returns The id, or undefined.
 */
export const toRecordId = (segment: string) => toWorkspaceId(segment);
