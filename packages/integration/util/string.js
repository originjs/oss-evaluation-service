/**
 * format string from underscore to small camel case
 * @param {*} str underscore string
 * @returns small camel case string
 */
// eslint-disable-next-line import/prefer-default-export
export function underscoreToSmallCamelCase(str) {
  return str.replace(/^[A-Z]/, (match) => match[0].toLowerCase()).replace(/_([a-z])/g, (match) => match[1].toUpperCase());
}
