/**
 * Picks the unit a person would use for a file size.
 * @param bytes Size in bytes.
 * @returns The value and its `Intl` unit.
 */
export const fileSizeUnit = (bytes: number) => {
  if (bytes < 1024) {
    return { value: bytes, unit: 'byte' } as const;
  }
  if (bytes < 1024 * 1024) {
    return { value: bytes / 1024, unit: 'kilobyte' } as const;
  }
  return { value: bytes / (1024 * 1024), unit: 'megabyte' } as const;
};
