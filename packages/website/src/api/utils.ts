export function toKilo(value: number | undefined | string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const number = typeof value === 'string' ? parseFloat(value) : value;
  return (number / 1000).toFixed(2);
};

export function formatNumberToFixed(value: number | undefined | string) {
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


export function changeBgColor(str: string) {
  if (str == 'A') {
    return 'bg-green-500';
  } else if (str == 'B') {
    return 'bg-green-200';
  } else if (str == 'C') {
    return 'bg-yellow-200';
  } else if (str == 'D') {
    return 'bg-amber-300';
  } else if (str == 'E') {
    return 'bg-red-300';
  }
  return 'bg-blue';
}