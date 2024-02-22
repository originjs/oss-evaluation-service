/**
 * format string from underscore to camel case
 * @param {*} str underscore string
 * @returns camel case string
 */
export function underscoreToCamelCase(str) {
    return str.replace(/_([a-z])/g, function (match, p) {
        return p.toUpperCase();
    });
}