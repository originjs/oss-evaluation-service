export function toKilo(num: number | undefined | string) {
  if (!num) {
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
