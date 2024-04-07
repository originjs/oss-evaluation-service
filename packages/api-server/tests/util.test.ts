import { expect, it } from 'vitest';
import { round, fixedRound } from '../src/utils/math';

describe('round function', () => {
  it('should round a positive number to 2 decimal places', () => {
    expect(round(3.14159, 2)).toEqual(3.14);
  });

  it('should round a negative number to 1 decimal place', () => {
    expect(round(-2.71828, 1)).toEqual(-2.7);
  });

  it('should round zero to any decimal places', () => {
    expect(round(0, 3)).toEqual(0);
  });
});

describe('fixedRound', () => {
  it('should round a number to the specified decimal places', () => {
    expect(fixedRound(3.14159, 2)).toEqual('3.14');
    expect(fixedRound(10.567, 1)).toEqual('10.6');
  });

  it('should return a string with the correct number of decimal places', () => {
    expect(fixedRound(5.12345, 3)).toEqual('5.123');
    expect(fixedRound(8.9, 0)).toEqual('9');
  });
});
