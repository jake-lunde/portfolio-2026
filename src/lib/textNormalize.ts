/* The one normalizer, shared by the build and the browser.

   scripts/build-text-index.mjs walks the source and keys every string it
   finds through this function. INSPECT's TEXT row keys the picked node's
   textContent through the same one and looks the key up. If the two ever
   drifted, the index would become a table nothing could hit and nothing
   would say so, so there is exactly one copy of the rules: the script
   transpiles this file in memory rather than restating them, the way
   test/token-edit.test.mjs already loads a TS module with no build step.

   The rules, in order, and why each one is here:
   · NFKC first, which also folds a non-breaking space down to a plain one
     (the source writes an entity, the browser hands back the glyph);
   · curly quotes flattened, for the same reason: a right single quote
     written as an entity and the same character typed straight into MDX
     are the same word to anyone searching for it;
   · whitespace collapsed, because JSX indents its text and the DOM does
     not;
   · lowercased, then stripped of leading and trailing punctuation, so a
     sentence keyed off a paragraph matches the same sentence keyed off
     the span sitting inside it. */

/** How much of a normalized string becomes its key. Long enough that two
    different lines almost never collide, short enough that a pick which
    carries only part of a run still lands on it. */
export const TEXT_KEY_LEN = 48

/** Under this a string is not an identity. "OPEN", "NEW", a bare year:
    they collide across a dozen files and nobody searches for them. */
export const TEXT_MIN_LEN = 8

const SINGLE_QUOTES = /[‘’‚‛′]/g
const DOUBLE_QUOTES = /[“”„‟″]/g
const EDGE_PUNCT = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu

export function normalizeText(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(EDGE_PUNCT, '')
    .trim()
}

/** The index key for a string, or an empty string when it is too short to
    be one. Both sides of the index call this and nothing else. */
export function textKey(raw: string): string {
  const normalized = normalizeText(raw)
  return normalized.length < TEXT_MIN_LEN ? '' : normalized.slice(0, TEXT_KEY_LEN)
}
