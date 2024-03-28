export function toKilo(value: number | undefined | string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const number = typeof value === 'string' ? parseFloat(value) : value;
  return (number / 1000).toFixed(2);
};

export function formatFloat(value: number | undefined | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const number = typeof value === 'string' ? parseFloat(value) : value;
  return number.toFixed(2);
}

export function formatNumber(value: number | undefined | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const number = typeof value === 'string' ? parseFloat(value) : value;
  return number;
}

export function formatString(valueString: string | null | undefined) { 
  return valueString === null || valueString === undefined || valueString === '' ? '-' : valueString
}
