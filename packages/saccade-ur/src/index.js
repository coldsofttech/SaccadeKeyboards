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
 * Which Urdu keyboard: `standard`, the usual Urdu key map (a second letter on Shift), or
 * `phonetic`, where each key types the Urdu letter that sounds like the Latin one on a QWERTY
 * keyboard. Both have the diacritics on their own layer.
 *
 * @typedef {'standard' | 'phonetic'} Arrangement
 */

/**
 * Which digits the number row types: `latin` (0-9) with the Urdu digits (۰-۹) on AltGr, or
 * `urdu` with the Latin digits on AltGr.
 *
 * @typedef {'latin' | 'urdu'} Digits
 */

const LATIN = '0123456789';
const URDU = '۰۱۲۳۴۵۶۷۸۹';

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
 * Keys from space separated characters (a letter may be several characters, such as a letter with a mark) and the
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
  digits === 'urdu'
    ? pair(URDU.at(n) ?? '', shift, LATIN.at(n))
    : pair(LATIN.at(n) ?? '', shift, URDU.at(n));

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
 * The number row both keyboards share.
 *
 * @param {Digits} digits
 * @returns {TextKey[]}
 */
const numberRow = (digits) => [
  pair('`', '~'),
  digitKey(digits, 1, '!'),
  digitKey(digits, 2, '@'),
  digitKey(digits, 3, '#'),
  digitKey(digits, 4, '$'),
  digitKey(digits, 5, '٪'),
  digitKey(digits, 6, '^'),
  digitKey(digits, 7, '&'),
  digitKey(digits, 8, '*'),
  digitKey(digits, 9, '('),
  digitKey(digits, 0, ')'),
  pair('-', '_'),
  pair('=', '+'),
];

/**
 * The standard keyboard: the usual Urdu key map, with a second letter on Shift.
 *
 * @param {Digits} digits
 * @returns {Key[][]}
 */
const standard = (digits) =>
  assemble([
    numberRow(digits),
    [...row('ق و ع ر ت ے ء ی ہ پ', 'ط ؤ غ ڑ ٹ ۓ ئ ض ۃ ص'), ...keys('[]\\', '{}|')],
    [...row('ا س د ف گ ح ج ک ل', 'آ ش ڈ ذ ژ خ چ ھ ث'), ...keys(";'", ':"')],
    [...row('ز ں م ن ب ، ۔', 'ظ'), pair(',', '<'), pair('.', '>'), pair('/', '?')],
  ]);

/**
 * The phonetic keyboard: the Urdu letter that sounds like the Latin one, Shift for its pair.
 *
 * @param {Digits} digits
 * @returns {Key[][]}
 */
const phonetic = (digits) =>
  assemble([
    numberRow(digits),
    [...row('ق ص ع ر ت ی ء ہ و پ', 'ط ض ے ڑ ٹ ئ ۓ ھ ؤ ف'), ...keys('[]\\', '{}|')],
    [...row('ا س د ف گ ہ ج ک ل', 'آ ص ڈ ذ غ ح ژ خ ث'), ...keys(";'", ':"')],
    [...row('ز ش چ ں ب ن م', 'ظ ض ط ذ ب ں ۃ'), pair('،', ','), pair('۔', '.'), pair('/', '?')],
  ]);

/**
 * The diacritics, the Urdu punctuation and a few signs the letters do not have.
 *
 * @param {LayerKey} back
 * @returns {Key[][]}
 */
const marks = (back) => [
  row('َ ِ ُ ّ ْ ٰ'),
  row('ً ٍ ٌ ٔ ؟ ؛'),
  row('٪ ٫ ٬ ؍ ۔ ،'),
  [...row('« » ﷲ'), backspaceKey],
  bottomRow(back),
];

/** @type {LayerKey} */
const MARKS_KEY = { type: 'layer', to: 'marks', label: 'اعراب', name: 'Diacritics' };
/** @type {LayerKey} */
const BACK_KEY = { type: 'layer', to: 'letters', label: 'حروف', name: 'Letters' };

/** What a screen reader says for the signs, which have no sound of their own. */
const NAMES = {
  'َ': 'زبر',
  'ِ': 'زیر',
  'ُ': 'پیش',
  'ّ': 'تشدید',
  'ْ': 'جزم',
  'ٰ': 'کھڑا زبر',
  'ً': 'تنوین زبر',
  'ٍ': 'تنوین زیر',
  'ٌ': 'تنوین پیش',
  'ٔ': 'ہمزہ',
  '؟': 'سوالیہ نشان',
  '؛': 'سیمی کولن',
  '،': 'کوما',
  '۔': 'ختمہ',
  '٪': 'فیصد',
  '٫': 'اعشاریہ',
  '٬': 'ہزار کا نشان',
  '«': 'کھلا اقتباس',
  '»': 'بند اقتباس',
  ﷲ: 'اللہ',
};

/**
 * The Urdu layout in the given arrangement.
 *
 * @param {Arrangement} [type] The keyboard.
 * @param {Digits} [digits] The digits of the number row.
 * @returns {Layout} The layout.
 */
export function createLayout(type = 'standard', digits = 'latin') {
  if (type !== 'standard' && type !== 'phonetic') {
    throw new Error(`Unknown arrangement "${type}". Use "standard" or "phonetic".`);
  }
  if (digits !== 'latin' && digits !== 'urdu') {
    throw new Error(`Unknown digits "${digits}". Use "latin" or "urdu".`);
  }
  /** @type {Key[]} */
  const bottom = [
    { ...altGrKey, width: 1.5 },
    { ...MARKS_KEY, width: 1.5 },
    ...keys('؟!'),
    { type: 'space', width: 3.5 },
    ...keys(':;'),
    { type: 'close', width: 1.5 },
  ];
  return {
    id: 'ur-PK',
    name: type === 'standard' ? 'Urdu (standard)' : 'Urdu (phonetic)',
    dir: 'rtl',
    decimal: '.',
    names: NAMES,
    layers: {
      letters: [...(type === 'standard' ? standard(digits) : phonetic(digits)), bottom],
      marks: marks(BACK_KEY),
    },
  };
}

/**
 * The Urdu standard layout with Latin digits, which is what `language="ur"` uses.
 *
 * @type {Layout}
 */
export const layout = createLayout();
