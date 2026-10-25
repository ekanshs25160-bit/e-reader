/**
 * Shared plural formatting helper for Flyleaf Reader.
 */
export function pluralize(count, singular, plural = `${singular}s`, includeCount = true) {
  const num = Number(count) || 0;
  const isOne = Math.abs(num) === 1;
  const word = isOne ? singular : plural;
  if (!includeCount) return word;
  return `${num.toLocaleString()} ${word}`;
}
