export function round(number, decimalPlaces) {
  if (!number) {
    return 0;
  }
  const power = 10 ** decimalPlaces;
  return Math.round(number * power) / power;
}

export function fixedRound(number, decimalPlaces) {
  return round(number, decimalPlaces).toFixed(decimalPlaces);
}
