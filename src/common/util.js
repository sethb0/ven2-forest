export function toKebab (str) {
  return str.toLowerCase().replace(/\W+/gu, '-');
}
