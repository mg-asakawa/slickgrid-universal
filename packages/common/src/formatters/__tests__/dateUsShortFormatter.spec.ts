import { describe, expect, it } from 'vitest';

import type { Column } from '../../interfaces/index.js';
import { Formatters } from '../index.js';

describe('the DateUsShort Formatter', () => {
  it('should return null when no value is provided', () => {
    const value = null;
    const result = Formatters.dateUsShort(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe(null);
  });

  it('should return original string when input value provided is not a valid date', () => {
    const value = 'TBD';
    const result = Formatters.dateUsShort(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('TBD');
  });

  it('should provide a dateIso formatted input and return a formatted date value without time when valid date value is provided', () => {
    const value = '2019-05-01 02:36:07';
    const result = Formatters.dateUsShort(0, 0, value, { type: 'dateIso' } as unknown as Column, {}, {} as any);
    expect(result).toBe('05/01/19');
  });

  it('should return a formatted date value in the morning when valid date value is provided', () => {
    const value = new Date('2019-05-01T02:36:07');
    const result = Formatters.dateUsShort(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('05/01/19');
  });

  it('should return a formatted date value in the afternoon when valid date value is provided', () => {
    const value = new Date('2019-05-01T20:36:07');
    const result = Formatters.dateUsShort(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('05/01/19');
  });
});
