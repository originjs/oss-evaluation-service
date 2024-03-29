export function round(val: number, decimalPlaces: number) {
  if (!val) {
    return 0;
  }
  const power = 10 ** decimalPlaces;
  return Math.round(val * power) / power;
}

export function fixedRound(val: number, decimalPlaces: number) {
  return round(val, decimalPlaces).toFixed(decimalPlaces);
}
