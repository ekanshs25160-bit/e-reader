/**
 * Shared plural formatting helper for Flyleaf Reader.
 *
 * Examples:
 *   pluralize(1, 'page') => '1 page'
 *   pluralize(2, 'page') => '2 pages'
 *   pluralize(1, 'book') => '1 book'
 *   pluralize(2, 'book') => '2 books'
 *   pluralize(5, 'volume') => '5 volumes'
 *   pluralize(1, 'page', 'pages', false) => 'page'
 *   pluralize(2, 'page', 'pages', false) => 'pages'
 *
 * @param {number|string} count - Number of items
 * @param {string} singular - Singular noun (e.g. "page", "book", "volume")
 * @param {string} [plural] - Plural noun (defaults to `${singular}s`)
 * @param {boolean} [includeCount=true] - Prepend formatted count
 * @returns {string} Formatted plural string
 */
export function pluralize(count, singular, plural = `${singular}s`, includeCount = true) {
  const num = Number(count) || 0;
  const isOne = Math.abs(num) === 1;
  const word = isOne ? singular : plural;
  if (!includeCount) return word;
  return `${typeof count === 'number' ? count.toLocaleString() : count} ${word}`;
}
