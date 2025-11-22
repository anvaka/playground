const FALLBACK_TITLE = 'Unknown title';
const FALLBACK_AUTHOR = 'Unknown author';

/**
 * Normalize the Audible autocomplete payload to the minimal fields
 * needed for the visualization layer.
 */
export function normalizeLetters(letterMap = {}, options = {}) {
  const maxItems = options.maxItems ?? 8;
  return Object.entries(letterMap)
    .map(([letter, payload]) => ({
      letter,
      items: extractAsinRows(payload).slice(0, maxItems)
    }))
    .sort((a, b) => a.letter.localeCompare(b.letter));
}

function extractAsinRows(payload) {
  const items = payload?.model?.items ?? [];
  return items
    .filter((entry) => entry?.view?.template === 'AsinRow')
    .map((entry) => simplifyItem(entry.model?.product_metadata))
    .filter((item) => Boolean(item.asin) && Boolean(item.cover));
}

function simplifyItem(metadata = {}) {
  return {
    asin: metadata.asin,
    cover: metadata.cover_art?.url,
    title: metadata.title?.value ?? FALLBACK_TITLE,
    author: metadata.author_name?.value ?? FALLBACK_AUTHOR
  };
}
