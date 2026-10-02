/** The backend's defaults (`FILES_MAX_SIZE`, `FILES_ALLOWED_TYPES`), checked before uploading. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
] as const;

/** For the file input's `accept`: types plus their usual extensions. */
export const FILE_INPUT_ACCEPT = [
  ...ALLOWED_FILE_TYPES,
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.pdf',
  '.txt',
  '.csv',
].join(',');
