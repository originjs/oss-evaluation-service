import { describe, expect, it } from 'vitest';
import { getLevelColor, getTagType, scorecardProgressColor } from '../src/utils/color';
import { toKilo, formatFloat, formatNumber, formatString } from '../src/utils/number';

describe('getLevelColor', () => {
  it('should return the color for level A', () => {
    const color = getLevelColor('A');
    expect(color).toBe('#21c45d');
  });

  it('should return the color for level B', () => {
    const color = getLevelColor('B');
    expect(color).toBe('#bbf7d0');
  });

  it('should return the color for level C', () => {
    const color = getLevelColor('C');
    expect(color).toBe('#fef08b');
  });

  it('should return the color for level D', () => {
    const color = getLevelColor('D');
    expect(color).toBe('#fcd44f');
  });

  it('should return the color for level E', () => {
    const color = getLevelColor('E');
    expect(color).toBe('#fca6a6');
  });

  it('should return the default color for an undefined input', () => {
    const color = getLevelColor(undefined);
    expect(color).toBe('#61a6fa');
  });

  it('should return the default color for an unknown input', () => {
    const color = getLevelColor('unknown');
    expect(color).toBe('#61a6fa');
  });
});

describe('getTagType', () => {
  it('should return "primary" for idx divisible by 4', () => {
    expect(getTagType(4)).toBe('primary');
  });

  it('should return "success" for idx divisible by 4 and remainder 1', () => {
    expect(getTagType(5)).toBe('success');
  });

  it('should return "warning" for idx divisible by 4 and remainder 2', () => {
    expect(getTagType(6)).toBe('warning');
  });

  it('should return "danger" for idx divisible by 4 and remainder 3', () => {
    expect(getTagType(7)).toBe('danger');
  });
});

describe('scorecardProgressColor', () => {
  it('should return "#f43146" for score less than 2', () => {
    expect(scorecardProgressColor(1)).toEqual('#f43146');
  });

  it('should return "#ec6f1a" for score between 2 and 4', () => {
    expect(scorecardProgressColor(3)).toEqual('#ec6f1a');
  });

  it('should return "#eeba18" for score between 5 and 7', () => {
    expect(scorecardProgressColor(6)).toEqual('#eeba18');
  });

  it('should return "#2da769" for score 8 or greater', () => {
    expect(scorecardProgressColor(8)).toEqual('#2da769');
  });
});

describe('toKilo', () => {
  it('should return - when value is undefined', () => {
    expect(toKilo(undefined)).toEqual('-');
  });

  it('should convert number to kilo correctly', () => {
    expect(toKilo(5000)).toEqual('5.00');
  });

  it('should convert string to kilo correctly', () => {
    expect(toKilo('7000')).toEqual('7.00');
  });

  it('should return - when value is an empty string', () => {
    expect(toKilo('')).toEqual('-');
  });
});

describe('formatFloat', () => {
  it('should return a string with two decimal places when given a number', () => {
    expect(formatFloat(1.2345)).toBe(1.23);
  });

  it('should return a string with two decimal places when given a string representation of a number', () => {
    expect(formatFloat('3.14159')).toBe(3.14);
  });

  it('should return a dash when given undefined, null, or an empty string', () => {
    expect(formatFloat(undefined)).toBe('-');
    expect(formatFloat(null)).toBe('-');
    expect(formatFloat('')).toBe('-');
  });
});

describe('formatNumber', () => {
  it('should return "-" when value is undefined', () => {
    expect(formatNumber(undefined)).toBe('-');
  });

  it('should return "-" when value is null', () => {
    expect(formatNumber(null)).toBe('-');
  });

  it('should return "-" when value is an empty string', () => {
    expect(formatNumber('')).toBe('-');
  });

  it('should return the number when value is a number', () => {
    expect(formatNumber(123)).toBe(123);
  });

  it('should return the number when value is a string representing a number', () => {
    expect(formatNumber('456')).toBe(456);
  });
});

describe('formatString', () => {
  it('should return "-" when valueString is null', () => {
    expect(formatString(null)).toEqual('-');
  });

  it('should return "-" when valueString is undefined', () => {
    expect(formatString(undefined)).toEqual('-');
  });

  it('should return "-" when valueString is an empty string', () => {
    expect(formatString('')).toEqual('-');
  });

  it('should return the valueString when it is not null, undefined, or an empty string', () => {
    expect(formatString('hello')).toEqual('hello');
  });
});
