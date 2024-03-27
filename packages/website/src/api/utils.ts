export function toKilo(num: number | undefined | string) {
  if (num === undefined || num === '') {
    return 'NaN';
  }
  if (typeof num === 'string') {
    return num;
  }
  if (num < 1000) {
    return num.toString();
  } else if (num < 100000) {
    return (num / 1000).toFixed(1) + 'k';
  } else {
    return Math.round(num / 1000) + 'k';
  }
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