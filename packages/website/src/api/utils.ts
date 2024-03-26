export function toKilo(num: number | undefined) {
  if (!num) {
    return 'NaN';
  }
  if (num < 1000) {
    return num.toString();
  } else if (num < 100000) {
    return (num / 1000).toFixed(1) + 'k';
  } else {
    return Math.round(num / 1000) + 'k';
  }
}
