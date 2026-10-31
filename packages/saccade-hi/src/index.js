import {
  altGrKey,
  backspaceKey,
  bottomRow,
  capsKey,
  keys,
  shiftKey,
} from '@coldsofttech/saccade-keyboards/core';

/** @typedef {import('@coldsofttech/saccade-keyboards/core').Layout} Layout */
/** @typedef {Layout['layers'][string][number][number]} Key */
/** @typedef {Extract<Key, { type: 'text' }>} TextKey */
/** @typedef {Extract<Key, { type: 'layer' }>} LayerKey */

/**
 * Which Hindi keyboard: `inscript`, the standard layout of India (consonants on the right hand,
 * vowels on the left, shift for the aspirated ones), or `phonetic`, where each key types the Hindi
 * letter that sounds like the Latin one on a QWERTY keyboard, with the vowel signs on their own
 * layer.
 *
 * @typedef {'inscript' | 'phonetic'} Arrangement
 */

/**
 * Which digits the number row types: `latin` (0-9) with the Devanagari digits (०-९) on AltGr, or
 * `devanagari` with the Latin digits on AltGr.
 *
 * @typedef {'latin' | 'devanagari'} Digits
 */

const LATIN = '0123456789';
const DEVANAGARI = '०१२३४५६७८९';

/**
 * A text key, with what it types with shift and after AltGr when it has them.
 *
 * @param {string} value
 * @param {string} [shift]
 * @param {string} [altgr]
 * @returns {TextKey}
 */
const pair = (value, shift, altgr) => ({
  type: 'text',
  value,
  ...(shift && { shift }),
  ...(altgr && { altgr }),
});

/**
 * Keys from space separated characters (a letter may be several characters, such as ज्ञ) and the
 * ones they type with shift, in the same order.
 *
 * @param {string} normal
 * @param {string} [shifted]
 * @returns {TextKey[]}
 */
const row = (normal, shifted = '') => {
  const upper = shifted.split(' ');
  return normal.split(' ').map((value, i) => pair(value, upper.at(i)));
};

/**
 * The key of a digit: the digit in the chosen script, the other script on AltGr.
 *
 * @param {Digits} digits
 * @param {number} n
 * @param {string} shift
 * @returns {TextKey}
 */
const digitKey = (digits, n, shift) =>
  digits === 'devanagari'
    ? pair(DEVANAGARI.at(n) ?? '', shift, LATIN.at(n))
    : pair(LATIN.at(n) ?? '', shift, DEVANAGARI.at(n));

/**
 * The four rows of an ANSI keyboard from the keys of each row.
 *
 * @param {TextKey[][]} rows
 * @returns {Key[][]}
 */
const assemble = ([top, second, third, bottom]) => [
  [...top, { ...backspaceKey, width: 2 }],
  [...second.slice(0, -1), { .../** @type {TextKey} */ (second.at(-1)), width: 1.5 }],
  [{ ...capsKey, width: 1.75 }, ...third, { type: 'enter', width: 2.25 }],
  [{ ...shiftKey, width: 2.25 }, ...bottom, { ...shiftKey, width: 2.75 }],
];

/**
 * The InScript keyboard: the signs sit on the number row, with Shift for the less common ones.
 *
 * @param {Digits} digits
 * @returns {Key[][]}
 */
const inscript = (digits) =>
  assemble([
    [
      pair('ॊ', 'ऒ'),
      digitKey(digits, 1, 'ऍ'),
      digitKey(digits, 2, 'ॅ'),
      digitKey(digits, 3, '्र'),
      digitKey(digits, 4, 'र्'),
      digitKey(digits, 5, 'ज्ञ'),
      digitKey(digits, 6, 'त्र'),
      digitKey(digits, 7, 'क्ष'),
      digitKey(digits, 8, 'श्र'),
      digitKey(digits, 9, '('),
      digitKey(digits, 0, ')'),
      pair('-', 'ः'),
      pair('ृ', 'ऋ'),
    ],
    row('ौ ै ा ी ू ब ह ग द ज ड ़ ॉ', 'औ ऐ आ ई ऊ भ ङ घ ध झ ढ ञ ऑ'),
    row('ो े ् ि ु प र क त च ट', 'ओ ए अ इ उ फ ऱ ख थ छ ठ'),
    row('ॆ ं म न व ल स , . य', 'ऎ ँ ण ऩ ऴ ळ श ष । य़'),
  ]);

/**
 * The phonetic keyboard: the Hindi letter that sounds like the Latin one, shift for its pair.
 *
 * @param {Digits} digits
 * @returns {Key[][]}
 */
const phonetic = (digits) =>
  assemble([
    [
      pair('`', '~'),
      digitKey(digits, 1, '!'),
      digitKey(digits, 2, '@'),
      digitKey(digits, 3, '#'),
      digitKey(digits, 4, '$'),
      digitKey(digits, 5, '%'),
      digitKey(digits, 6, '^'),
      digitKey(digits, 7, '&'),
      digitKey(digits, 8, '*'),
      digitKey(digits, 9, '('),
      digitKey(digits, 0, ')'),
      pair('-', '_'),
      pair('=', '+'),
    ],
    [...row('ट ड ए र त य उ इ ओ प', 'ठ ढ ऐ ऋ थ ञ ऊ ई औ फ'), ...keys('[]\\', '{}|')],
    [...row('अ स द फ़ ग ह ज क ल', 'आ श ध ़ घ ः झ ख ळ'), ...keys(";'", ':"')],
    [...row('ज़ क्ष च व ब न म', 'ष ज्ञ छ ँ भ ण ं'), pair(',', '॥'), pair('.', '।'), pair('/', '?')],
  ]);

/**
 * The vowel signs, the other signs and the conjuncts, which the phonetic letters do not have.
 *
 * @param {LayerKey} back
 * @returns {Key[][]}
 */
const signs = (back) => [
  row('ा ि ी ु ू ृ'),
  row('े ै ो ौ ॅ ॉ'),
  row('ं ँ ः ् ़ ऽ'),
  [...row('। ॥ ॐ ङ त्र श्र'), backspaceKey],
  bottomRow(back),
];

/** @type {LayerKey} */
const LETTERS_KEY = { type: 'layer', to: 'signs', label: 'मात्रा', name: 'Vowel signs' };
/** @type {LayerKey} */
const BACK_KEY = { type: 'layer', to: 'letters', label: 'अक्षर', name: 'Letters' };

/** What a screen reader says for the signs, which have no sound of their own. */
const NAMES = {
  'ा': 'आ की मात्रा',
  'ि': 'इ की मात्रा',
  'ी': 'ई की मात्रा',
  'ु': 'उ की मात्रा',
  'ू': 'ऊ की मात्रा',
  'ृ': 'ऋ की मात्रा',
  'े': 'ए की मात्रा',
  'ै': 'ऐ की मात्रा',
  'ो': 'ओ की मात्रा',
  'ौ': 'औ की मात्रा',
  'ॅ': 'चंद्र',
  'ॉ': 'ऑ की मात्रा',
  'ॊ': 'ओ की छोटी मात्रा',
  'ॆ': 'ए की छोटी मात्रा',
  'ं': 'अनुस्वार',
  'ँ': 'चंद्रबिंदु',
  'ः': 'विसर्ग',
  '्': 'हलंत',
  '़': 'नुक़्ता',
  ऽ: 'अवग्रह',
  ॐ: 'ओम',
  '।': 'पूर्ण विराम',
  '॥': 'दोहरा पूर्ण विराम',
  '₹': 'रुपया',
};

/**
 * The Hindi layout in the given arrangement.
 *
 * @param {Arrangement} [type] The keyboard.
 * @param {Digits} [digits] The digits of the number row.
 * @returns {Layout} The layout.
 */
export function createLayout(type = 'inscript', digits = 'latin') {
  if (type !== 'inscript' && type !== 'phonetic') {
    throw new Error(`Unknown arrangement "${type}". Use "inscript" or "phonetic".`);
  }
  if (digits !== 'latin' && digits !== 'devanagari') {
    throw new Error(`Unknown digits "${digits}". Use "latin" or "devanagari".`);
  }
  const isInscript = type === 'inscript';
  /** @type {Key[]} */
  const bottom = [
    { ...altGrKey, width: 1.5 },
    ...(isInscript ? [] : [{ ...LETTERS_KEY, width: 1.5 }]),
    ...keys('?!'),
    { type: 'space', width: isInscript ? 5 : 3.5 },
    ...keys(isInscript ? ':;' : ':॰'),
    { type: 'close', width: 1.5 },
  ];
  return {
    id: 'hi-IN',
    name: isInscript ? 'Hindi (InScript)' : 'Hindi (phonetic)',
    dir: 'ltr',
    decimal: '.',
    names: NAMES,
    layers: {
      letters: [...(isInscript ? inscript(digits) : phonetic(digits)), bottom],
      ...(isInscript ? {} : { signs: signs(BACK_KEY) }),
    },
  };
}

/**
 * The Hindi InScript layout with Latin digits, which is what `language="hi"` uses.
 *
 * @type {Layout}
 */
export const layout = createLayout();
