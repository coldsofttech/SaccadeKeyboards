import { altGrKey, keys, physicalRows } from '@coldsofttech/saccade-keyboards/core';

/** @typedef {import('@coldsofttech/saccade-keyboards/core').Layout} Layout */

/**
 * How the letters are arranged: `qwerty` like a Spanish physical keyboard, or `alphabetical` from a
 * to z with the ñ after the n. Every other key stays where it is on the physical keyboard.
 *
 * @typedef {'qwerty' | 'alphabetical'} Arrangement
 */

/** The letters of the three rows of each arrangement. The ñ is the last key of the second row. */
const ARRANGEMENTS = new Map([
  ['qwerty', ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm']],
  ['alphabetical', ['abcdefghij', 'klmnñopqrs', 'tuvwxyz']],
]);

/**
 * The country the keyboard is for: `ES` (Spain), `MX` (Mexico), `AR` (Argentina), `CO` (Colombia),
 * `US` (the United States) or `LATAM` (Latin America in general).
 *
 * @typedef {'ES' | 'MX' | 'AR' | 'CO' | 'US' | 'LATAM'} Region
 */

/**
 * The accented vowels and the ü. A Spanish keyboard types them with a dead key (the accent, then
 * the vowel), which this keyboard does not have, so AltGr types them in one press.
 */
const ACCENTS = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ü' };

/**
 * The keys of a Spanish keyboard, an ISO keyboard with the ñ, the accent key and the ç. AltGr types
 * the characters the main view has no key for: | @ # ~ € ¬ \ [ ] { }.
 */
const SPAIN = {
  iso: true,
  digits: ["º1234567890'¡", 'ª!"·$%&/()=?¿'],
  end2: ['`+', '^*'],
  end3: ['´ç', '¨Ç'],
  extra4: ['<', '>'],
  end4: [',.-', ';:_'],
  altgr: {
    ...ACCENTS,
    º: '\\',
    1: '|',
    2: '@',
    3: '#',
    4: '~',
    5: '€',
    6: '¬',
    '`': '[',
    '+': ']',
    '´': '{',
    ç: '}',
  },
};

/**
 * The keys of a Latin American keyboard, which Spanish speakers in the United States use too.
 * AltGr types | @ ~ € ¬ \ ^ and the grave accent, which the main view has no key for.
 */
const LATIN_AMERICA = {
  iso: true,
  digits: ["|1234567890'¿", '°!"#$%&/()=?¡'],
  end2: ['´+', '¨*'],
  end3: ['{}', '[]'],
  extra4: ['<', '>'],
  end4: [',.-', ';:_'],
  altgr: { ...ACCENTS, 1: '|', 2: '@', 4: '~', 5: '€', 6: '¬', "'": '\\', '´': '^', '+': '`' },
};

/** What a screen reader says for the characters Spanish adds. */
const NAMES = {
  '¿': 'signo de interrogación de apertura',
  '¡': 'signo de exclamación de apertura',
  '€': 'euro',
};

/** What differs by country: the name, the physical keys and the decimal sign of the number pad. */
const REGIONS = new Map([
  ['ES', { name: 'Spanish (ES)', keyboard: SPAIN, decimal: ',' }],
  ['MX', { name: 'Spanish (MX)', keyboard: LATIN_AMERICA, decimal: '.' }],
  ['AR', { name: 'Spanish (AR)', keyboard: LATIN_AMERICA, decimal: ',' }],
  ['CO', { name: 'Spanish (CO)', keyboard: LATIN_AMERICA, decimal: ',' }],
  ['US', { name: 'Spanish (US)', keyboard: LATIN_AMERICA, decimal: '.' }],
  ['LATAM', { name: 'Spanish (Latin America)', keyboard: LATIN_AMERICA, decimal: '.' }],
]);

/**
 * The Spanish layout in the given arrangement, for a country.
 *
 * @param {Arrangement} [type] The arrangement of the letters.
 * @param {Region} [region] The country, which sets the physical keys.
 * @returns {Layout} The layout.
 */
export function createLayout(type = 'qwerty', region = 'ES') {
  const country = REGIONS.get(region);
  if (!country) {
    throw new Error(
      `Unknown region "${region}". Use ${[...REGIONS.keys()].map((name) => `"${name}"`).join(', ')}.`,
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
    id: region === 'LATAM' ? 'es-419' : `es-${region}`,
    name: country.name,
    dir: 'ltr',
    decimal: country.decimal,
    names: NAMES,
    layers: {
      letters: [
        ...physicalRows({ ...country.keyboard, letters }),
        [
          { ...altGrKey, width: 1.5 },
          ...keys('¿?'),
          { type: 'space', width: 5 },
          ...keys('¡!'),
          { type: 'close', width: 1.5 },
        ],
      ],
    },
  };
}

/**
 * The Spanish layout for Spain in QWERTY order, which is what `language="es"` uses.
 *
 * @type {Layout}
 */
export const layout = createLayout();
