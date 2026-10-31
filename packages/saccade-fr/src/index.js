import { altGrKey, keys, physicalRows } from '@coldsofttech/saccade-keyboards/core';

/** @typedef {import('@coldsofttech/saccade-keyboards/core').Layout} Layout */

/**
 * How the letters are arranged: `azerty` as on the keyboard of the region (QWERTY in Canada and
 * QWERTZ in Switzerland), or `alphabetical` from a to z. Every other key stays where it is on the
 * physical keyboard.
 *
 * @typedef {'azerty' | 'alphabetical'} Arrangement
 */

/**
 * The country the keyboard is for: `FR` (France), `BE` (Belgium), `CA` (Canada) or `CH`
 * (Switzerland).
 *
 * @typedef {'FR' | 'BE' | 'CA' | 'CH'} Region
 */

/** The letters of the three rows as each region has them. */
const AZERTY = ['azertyuiop', 'qsdfghjklm', 'wxcvbn'];
const QWERTY = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const QWERTZ = ['qwertzuiop', 'asdfghjkl', 'yxcvbnm'];

/** The letters from a to z on the same keys, by how many letters the second row has. */
const ALPHABETICAL = new Map([
  [10, ['abcdefghij', 'klmnopqrst', 'uvwxyz']],
  [9, ['abcdefghij', 'klmnopqrs', 'tuvwxyz']],
]);

/**
 * The accented letters, the ligatures and the guillemets. A French keyboard types the circumflex
 * and diaeresis vowels with a dead key (the accent, then the vowel), which this keyboard does not
 * have, so AltGr types them in one press, on the vowel or on a key beside it. Keys are named by
 * what they type.
 */
const ACCENTS = {
  a: 'â',
  z: 'ê',
  r: 'ë',
  y: 'ÿ',
  u: 'û',
  i: 'î',
  o: 'ô',
  p: 'œ',
  q: 'æ',
  j: 'ü',
  k: 'ï',
  w: '«',
  x: '»',
};

/** What caps lock types on the keys of the accented letters, which have a digit with shift. */
const CAPITALS = { é: 'É', è: 'È', ç: 'Ç', à: 'À', ù: 'Ù' };

/** The keys of a French keyboard: the accented letters are on the number row, which needs shift. */
const FRANCE = {
  iso: true,
  letters: AZERTY,
  digits: ['²&é"\'(-è_çà)=', ' 1234567890°+'],
  end2: ['^$', '¨£'],
  end3: ['ù*', '%µ'],
  extra4: ['<', '>'],
  end4: [',;:!', '?./§'],
  capitals: CAPITALS,
  altgr: {
    ...ACCENTS,
    é: '~',
    '"': '#',
    "'": '{',
    '(': '[',
    '-': '|',
    è: '`',
    _: '\\',
    ç: '^',
    à: '@',
    ')': ']',
    '=': '}',
    $: '¤',
    e: '€',
  },
};

/** The keys of a Belgian keyboard, which is an AZERTY keyboard with other signs. */
const BELGIUM = {
  iso: true,
  letters: AZERTY,
  digits: ['²&é"\'(§è!çà)-', ' 1234567890°_'],
  end2: ['^$', '¨*'],
  end3: ['ùµ', '%£'],
  extra4: ['<', '>'],
  end4: [',;:=', '?./+'],
  capitals: CAPITALS,
  altgr: {
    ...ACCENTS,
    '&': '|',
    é: '@',
    '"': '#',
    '(': '[',
    '§': '^',
    ç: '{',
    à: '}',
    '^': '[',
    $: ']',
    '<': '\\',
    '=': '~',
    e: '€',
  },
};

/** The keys of a Canadian keyboard (Canadian Multilingual Standard), which has QWERTY letters. */
const CANADA = {
  iso: true,
  letters: QWERTY,
  digits: ['/1234567890-=', '\\!@#$%?&*()_+'],
  end2: ['^ç', '¨Ç'],
  end3: [';èà', ':ÈÀ'],
  extra4: ['ù', 'Ù'],
  end4: [',.é', '\'"É'],
  altgr: {
    ...ACCENTS,
    3: '£',
    4: '¢',
    5: '¤',
    6: '¬',
    7: '¦',
    8: '²',
    9: '³',
    0: '¼',
    '-': '½',
    '=': '¾',
    e: '€',
  },
};

/** The keys of a Swiss keyboard, which has QWERTZ letters and the è, é and à on the right. */
const SWITZERLAND = {
  iso: true,
  letters: QWERTZ,
  digits: ["§1234567890'^", '°+"*ç%&/()=?`'],
  end2: ['è¨', 'ü!'],
  end3: ['éà$', 'öä£'],
  extra4: ['<', '>'],
  end4: [',.-', ';:_'],
  altgr: {
    ...ACCENTS,
    1: '¦',
    2: '@',
    3: '#',
    4: '°',
    5: '§',
    6: '¬',
    7: '|',
    8: '¢',
    "'": '´',
    '^': '~',
    è: '[',
    '¨': ']',
    à: '{',
    $: '}',
    '<': '\\',
    e: '€',
  },
};

/** What differs by country: the name, the physical keys and the decimal sign of the number pad. */
const REGIONS = new Map([
  ['FR', { name: 'French (FR)', keyboard: FRANCE, decimal: ',' }],
  ['BE', { name: 'French (BE)', keyboard: BELGIUM, decimal: ',' }],
  ['CA', { name: 'French (CA)', keyboard: CANADA, decimal: ',' }],
  ['CH', { name: 'French (CH)', keyboard: SWITZERLAND, decimal: '.' }],
]);

/** What a screen reader says for the characters French adds. */
const NAMES = {
  '²': 'exposant deux',
  '³': 'exposant trois',
  '°': 'degré',
  '§': 'paragraphe',
  µ: 'micro',
  '£': 'livre',
  '¤': 'symbole monétaire',
  '€': 'euro',
  '«': 'guillemet ouvrant',
  '»': 'guillemet fermant',
  '^': 'accent circonflexe',
  '¨': 'tréma',
  '`': 'accent grave',
  '´': 'accent aigu',
  '~': 'tilde',
};

/**
 * The French layout in the given arrangement, for a country.
 *
 * @param {Arrangement} [type] The arrangement of the letters.
 * @param {Region} [region] The country, which sets the physical keys.
 * @returns {Layout} The layout.
 */
export function createLayout(type = 'azerty', region = 'FR') {
  const country = REGIONS.get(region);
  if (!country) {
    throw new Error(
      `Unknown region "${region}". Use ${[...REGIONS.keys()].map((name) => `"${name}"`).join(', ')}.`,
    );
  }
  if (type !== 'azerty' && type !== 'alphabetical') {
    throw new Error(`Unknown arrangement "${type}". Use "azerty" or "alphabetical".`);
  }
  const { letters: own, ...keyboard } = country.keyboard;
  const letters = type === 'azerty' ? own : (ALPHABETICAL.get(own.at(1)?.length ?? 0) ?? own);
  return {
    id: `fr-${region}`,
    name: country.name,
    dir: 'ltr',
    decimal: country.decimal,
    names: NAMES,
    layers: {
      letters: [
        ...physicalRows({ ...keyboard, letters }),
        [
          { ...altGrKey, width: 1.5 },
          ...keys('«»'),
          { type: 'space', width: 5 },
          ...keys('?!'),
          { type: 'close', width: 1.5 },
        ],
      ],
    },
  };
}

/**
 * The French layout for France in AZERTY order, which is what `language="fr"` uses.
 *
 * @type {Layout}
 */
export const layout = createLayout();
