type ToKiloOptions = {
  fractionDigits?: number;
  emptyValue?: string;
};

export function toKilo(
  value: number | undefined | string,
  { fractionDigits = 2, emptyValue = '-' }: ToKiloOptions = {},
): string {
  if (value === undefined || value === null || value === '') {
    return emptyValue;
  }

  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (number < 1000) {
    return number.toString();
  } else if (number < 100000) {
    return (number / 1000).toFixed(fractionDigits) + ' k';
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

export function getBubbleChartHeightByCount(projectNumber: number) {
  let height = 100;
  if (projectNumber > 30) {
    height = 500;
  } else if (projectNumber > 20) {
    height = 400;
  } else if (projectNumber > 10) {
    height = 350;
  } else if (projectNumber > 5) {
    height = 300;
  } else if (projectNumber > 1) {
    height = 200;
  }
  return height;
}
