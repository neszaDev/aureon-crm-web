import { describe, expect, it } from 'vitest';
import { fileSizeUnit } from './FileSize';

describe(fileSizeUnit, () => {
  it('keeps small sizes in bytes', () => {
    expect(fileSizeUnit(512)).toStrictEqual({ value: 512, unit: 'byte' });
  });

  it('switches to kilobytes and megabytes at 1024', () => {
    expect(fileSizeUnit(1536)).toStrictEqual({ value: 1.5, unit: 'kilobyte' });
    expect(fileSizeUnit(10 * 1024 * 1024)).toStrictEqual({ value: 10, unit: 'megabyte' });
  });
});
