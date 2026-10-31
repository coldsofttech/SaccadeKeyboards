import { altGrKey, keys, physicalRows } from '@coldsofttech/saccade-keyboards/core';

/** @typedef {import('@coldsofttech/saccade-keyboards/core').Layout} Layout */

/**
 * How the letters are arranged: `qwerty` like a physical keyboard, or `alphabetical` from a to z.
 * Every other key stays where it is on the physical keyboard.
 *
 * @typedef {'qwerty' | 'alphabetical'} Arrangement
 */

/** The letters of the three rows of each arrangement. */
const ARRANGEMENTS = new Map([
  ['qwerty', ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']],
  ['alphabetical', ['abcdefghij', 'klmnopqrs', 'tuvwxyz']],
]);

/**
 * The country the keyboard is for: `US`, `GB` (`UK` is accepted too), `AU`, `CA` or `IN`.
 *
 * @typedef {'US' | 'GB' | 'UK' | 'AU' | 'CA' | 'IN'} Region
 */

/**
 * What AltGr types on the United States-International keyboard, which the US, Australia and
 * Canada use for the accents and signs. A plain US keyboard has no AltGr. Keys are named by what
 * they type.
 */
const INTERNATIONAL = {
  1: '¡',
  2: '²',
  3: '³',
  4: '¤',
  5: '€',
  6: '¼',
  7: '½',
  8: '¾',
  9: '‘',
  0: '’',
  '-': '¥',
  '=': '×',
  q: 'ä',
  w: 'å',
  e: 'é',
  r: '®',
  t: 'þ',
  y: 'ü',
  u: 'ú',
  i: 'í',
  o: 'ó',
  p: 'ö',
  '[': '«',
  ']': '»',
  '\\': '¬',
  a: 'á',
  s: 'ß',
  d: 'ð',
  l: 'ø',
  ';': '¶',
  "'": '´',
  z: 'æ',
  c: '©',
  n: 'ñ',
  m: 'µ',
  ',': 'ç',
  '/': '¿',
};

/** What AltGr types on a British keyboard: the euro, the broken bar and the acute accents. */
const BRITISH = { '`': '¦', 4: '€', a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };

/** What AltGr types on an Indian English keyboard: the rupee sign. */
const INDIAN = { 4: '₹' };

/** The keys of a US (ANSI) keyboard, which Australia, Canada and India share for English. */
const ANSI = {
  iso: false,
  digits: ['`1234567890-=', '~!@#$%^&*()_+'],
  end2: ['[]\\', '{}|'],
  end3: [";'", ':"'],
  end4: [',./', '<>?'],
};

/** The keys of a British (ISO) keyboard: a tall Enter, a hash key and a second backslash key. */
const ISO = {
  iso: true,
  digits: ['`1234567890-=', '¬!"£$%^&*()_+'],
  end2: ['[]', '{}'],
  end3: [";'#", ':@~'],
  extra4: ['\\', '|'],
  end4: [',./', '<>?'],
};

/** What differs by country: the name, the physical keys and what AltGr types. */
const REGIONS = new Map([
  ['US', { name: 'English (US)', keyboard: ANSI, altgr: INTERNATIONAL }],
  ['GB', { name: 'English (GB)', keyboard: ISO, altgr: BRITISH }],
  ['AU', { name: 'English (AU)', keyboard: ANSI, altgr: INTERNATIONAL }],
  ['CA', { name: 'English (CA)', keyboard: ANSI, altgr: INTERNATIONAL }],
  ['IN', { name: 'English (IN)', keyboard: ANSI, altgr: INDIAN }],
]);

/**
 * The English layout in the given arrangement, for a country.
 *
 * @param {Arrangement} [type] The arrangement of the letters.
 * @param {Region} [region] The country, which sets the physical keys and the currency signs.
 * @returns {Layout} The layout.
 */
export function createLayout(type = 'qwerty', region = 'US') {
  const code = region === 'UK' ? 'GB' : region;
  const country = REGIONS.get(code);
  if (!country) {
    throw new Error(
      `Unknown region "${region}". Use ${[...REGIONS.keys()].map((name) => `"${name}"`).join(', ')} or "UK".`,
    );
  }
  const letters = ARRANGEMENTS.get(type);
  if (!letters) {
    throw new Error(
      `Unknown arrangement "${type}". Use ${[...ARRANGEMENTS.keys()]
        .map((name) => `"${name}"`)
        .join(' or ')}.`,
    );
  }
  return {
    id: `en-${code}`,
    name: country.name,
    dir: 'ltr',
    layers: {
      letters: [
        ...physicalRows({ ...country.keyboard, altgr: country.altgr, letters }),
        [
          { ...altGrKey, width: 1.5 },
          ...keys('?!'),
          { type: 'space', width: 5 },
          ...keys('@_'),
          { type: 'close', width: 1.5 },
        ],
      ],
    },
  };
}

/**
 * The US English layout in QWERTY order, which is what `language="en"` uses.
 *
 * @type {Layout}
 */
export const layout = createLayout();
