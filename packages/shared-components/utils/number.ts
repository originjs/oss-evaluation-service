export function toKilo(value: number | undefined | string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (number < 1000) {
    return number.toString();
  } else if (number < 100000) {
    return (number / 1000).toFixed(2) + ' k';
  } else {
    return Math.round(number / 1000) + ' k';
  }
}

export function formatFloat(value: number | undefined | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const number = typeof value === 'string' ? parseFloat(value) : value;
  return parseFloat(number.toFixed(2));
}

export function formatNumber(value: number | undefined | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const number = typeof value === 'string' ? parseFloat(value) : value;
  return number;
}

export function formatString(valueString: string | null | undefined) {
  return valueString === null || valueString === undefined || valueString === ''
    ? '-'
    : valueString;
}
