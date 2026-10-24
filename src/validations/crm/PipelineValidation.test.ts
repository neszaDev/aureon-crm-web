import { describe, expect, it } from 'vitest';
import { StageValidation } from './PipelineValidation';

const firstMessage = (values: Record<string, unknown>) =>
  StageValidation.safeParse({ name: 'Proposal', probability: 40, ...values }).error?.issues[0]
    ?.message;

describe('stage validation', () => {
  it('trims the name', () => {
    expect(StageValidation.parse({ name: '  Proposal ', probability: 40 }).name).toBe('Proposal');
  });

  it('requires a name of at most 60 characters', () => {
    expect(firstMessage({ name: '   ' })).toBe('required');
    expect(firstMessage({ name: 'x'.repeat(60) })).toBeUndefined();
    expect(firstMessage({ name: 'x'.repeat(61) })).toBe('too_long');
  });

  it('allows whole probabilities from 0 to 100', () => {
    expect(firstMessage({ probability: 0 })).toBeUndefined();
    expect(firstMessage({ probability: 100 })).toBeUndefined();
    expect(firstMessage({ probability: 101 })).toBe('probability_range');
    expect(firstMessage({ probability: -1 })).toBe('probability_range');
    expect(firstMessage({ probability: 12.5 })).toBe('probability_range');
  });

  it('asks for a number when the field is empty', () => {
    expect(firstMessage({ probability: Number.NaN })).toBe('invalid_number');
  });
});
