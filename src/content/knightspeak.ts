/* Knight-speak — the medieval skin's language modifier (Notion: update
   language). A deterministic phrase/word substitution applied to base
   copy when a key has no hand-written medieval slot; explicit slots in
   copy.json always win, this is the long-tail fallback.

   Brief constraints: output stays terse (no rule grows a string by more
   than a few characters), the original intent must survive, and the
   dictionary is curated against what copy.json actually says — never a
   generative rewrite. Facts, tech labels, and proper nouns fall through
   untouched because they simply aren't in the dictionary. */

/* Phrases before words: the alternation is sorted longest-first so
   "you are" wins over "you". Keys are lowercase; case is re-applied
   from the matched text (ALL CAPS / Capitalized / lower). */
const RULES: Record<string, string> = {
  'is coming soon': 'cometh anon',
  "you're": 'thou art',
  "you've": 'thou hast',
  "you'll": 'thou shalt',
  'you are': 'thou art',
  'you have': 'thou hast',
  'do you': 'dost thou',
  'thank you': 'thank thee',
  you: 'thou', // → 'thee' after a preposition, see replacer
  your: 'thy', // → 'thine' before a vowel, see replacer
  yours: 'thine',
  yourself: 'thyself',
  has: 'hath',
  does: 'doth',
  says: 'saith',
  is: 'be',
  are: 'be',
  soon: 'anon',
  yes: 'aye',
  before: 'ere',
  almost: 'nigh',
  never: "ne'er",
  old: 'olde',
  locked: 'barred',
  thanks: 'gramercy',
  hello: 'hail',
  welcome: 'well met',
  goodbye: 'farewell',
  very: 'most',
  really: 'truly',
  please: 'prithee',
}

const PATTERN = new RegExp(
  `\\b(?:${Object.keys(RULES)
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/'/g, "['’]"))
    .join('|')})\\b`,
  'gi',
)

/* "you" is object-case after a preposition ("for thee", not "for thou"). */
const PREPOSITION_BEFORE = /\b(?:for|to|of|with|by|from|at|unto)\s+$/i

function matchCase(src: string, out: string): string {
  if (/[A-Z]/.test(src) && src === src.toUpperCase()) return out.toUpperCase()
  if (/^[A-Z]/.test(src)) return out.charAt(0).toUpperCase() + out.slice(1)
  return out
}

export function toKnightSpeak(text: string): string {
  return text.replace(PATTERN, (match, offset: number) => {
    const key = match.toLowerCase().replace(/’/g, "'")
    let out = RULES[key]
    if (key === 'you' && PREPOSITION_BEFORE.test(text.slice(0, offset))) {
      out = 'thee'
    } else if (key === 'your' && /^\s+[aeiou]/i.test(text.slice(offset + match.length))) {
      out = 'thine'
    }
    return matchCase(match, out)
  })
}
