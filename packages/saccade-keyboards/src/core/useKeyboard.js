import { useState } from 'react';
import { PUNCTUATION_NAMES } from './layout.js';

/** @typedef {import('./layout.js').Key} Key */
/** @typedef {import('./layout.js').Layout} Layout */
/** @typedef {import('./applyKey.js').KeyPress} KeyPress */

/**
 * @typedef {object} UseKeyboardOptions
 * @property {Layout} layout The layout to drive.
 * @property {(key: KeyPress) => void} onKey A key was pressed (the space key types a space).
 * @property {() => void} [onClose] The hide key was pressed.
 */

/**
 * @typedef {object} KeyDescription
 * @property {string} label Text to show on the key; the icon of a control key.
 * @property {string} [caption] Text to show under the icon of a control key, such as `Shift`.
 * @property {string} name What a screen reader says.
 * @property {boolean} [pressed] Whether the key is on, for the shift, caps lock, AltGr and Num Lock keys.
 * @property {boolean} [disabled] Whether the key is off, for the number pad while Num Lock is off.
 */

/** @type {Record<string, KeyDescription>} */
const FIXED = {
  shift: { label: '⇧', caption: 'Shift', name: 'Shift' },
  caps: { label: '⇪', caption: 'Caps', name: 'Caps lock' },
  altgr: { label: '⎇', caption: 'AltGr', name: 'AltGr' },
  numlock: { label: '⇭', caption: 'Num', name: 'Num lock' },
  backspace: { label: '⌫', caption: 'Backspace', name: 'Backspace' },
  enter: { label: '⏎', caption: 'Enter', name: 'Enter' },
  space: { label: '␣', caption: 'space', name: 'Space' },
  close: { label: '⌄', caption: 'Hide', name: 'Hide keyboard' },
};

/**
 * What a text key types: its AltGr character after the AltGr key (capitalised while shift is on,
 * if it is a letter), otherwise its shifted character while shift is on, if it has one.
 *
 * @param {import('./layout.js').TextKey} key The key.
 * @param {boolean} shifted Whether shift is on.
 * @param {boolean} [altGr] Whether AltGr is on.
 * @returns {string} The character.
 */
export function typedValue(key, shifted, altGr = false) {
  if (altGr && key.altgr) {
    const capital = key.altgr.toUpperCase();
    return shifted && capital.length === key.altgr.length ? capital : key.altgr;
  }
  return shifted && key.shift ? key.shift : key.value;
}

// A sign that only sits on a letter (a vowel sign, a virama) is shown on a dotted circle.
/** @param {string} value */
const shown = (value) => (/^\p{M}$/u.test(value) ? `◌${value}` : value);

/**
 * The state and behaviour of an on-screen keyboard, without any markup, so a custom UI can render
 * the keys itself. Shift is `'off'`, `'once'` (the next key, from the shift key) or `'caps'` (from
 * the caps lock key). AltGr is on for the next key only, like shift. Num Lock starts on; while it
 * is off the keys of the number pad do nothing.
 *
 * @param {UseKeyboardOptions} options Layout and callbacks.
 * @returns {{
 *   layer: string,
 *   shift: 'off' | 'once' | 'caps',
 *   altGr: boolean,
 *   numLock: boolean,
 *   rows: Key[][],
 *   press: (key: Key) => void,
 *   describe: (key: Key) => KeyDescription,
 * }} What to render and how to react.
 */
export function useKeyboard({ layout, onKey, onClose }) {
  const [chosen, setChosen] = useState('');
  const [shift, setShift] = useState(/** @type {'off' | 'once' | 'caps'} */ ('off'));
  const [altGr, setAltGr] = useState(false);
  const [numLock, setNumLock] = useState(true);
  // Fall back to the first layer when the layout changes to one without the chosen layer.
  const layers = new Map(Object.entries(layout.layers));
  const layer = layers.has(chosen) ? chosen : [...layers.keys()][0];
  /** @type {Map<string, string>} */
  const names = new Map(Object.entries({ ...PUNCTUATION_NAMES, ...layout.names }));

  // Caps lock capitalises letters only; a key such as a digit keeps its character without shift.
  /** @param {import('./layout.js').TextKey} key */
  const isShifted = (key) =>
    shift === 'once' || (shift === 'caps' && key.shift === key.value.toUpperCase());

  /** @param {Key} key */
  const press = (key) => {
    if (key.type === 'text' && key.numpad && !numLock) return;
    switch (key.type) {
      case 'text':
        onKey({ type: 'text', value: typedValue(key, isShifted(key), altGr) });
        if (shift === 'once') setShift('off');
        setAltGr(false);
        break;
      case 'space':
        onKey({ type: 'text', value: ' ' });
        if (shift === 'once') setShift('off');
        setAltGr(false);
        break;
      case 'shift':
        setShift(shift === 'off' ? 'once' : 'off');
        break;
      case 'altgr':
        setAltGr(!altGr);
        break;
      case 'numlock':
        setNumLock(!numLock);
        break;
      case 'caps':
        setShift(shift === 'caps' ? 'off' : 'caps');
        break;
      case 'layer':
        setChosen(key.to);
        setShift('off');
        setAltGr(false);
        break;
      case 'close':
        onClose?.();
        break;
      default:
        onKey({ type: key.type });
    }
  };

  /** @param {Key} key @returns {KeyDescription} */
  const describe = (key) => {
    if (key.type === 'text') {
      const value = typedValue(key, isShifted(key), altGr);
      const description = { label: shown(value), name: names.get(value) ?? value };
      return key.numpad ? { ...description, disabled: !numLock } : description;
    }
    if (key.type === 'layer') return { label: key.label, name: key.name ?? key.label };
    if (key.type === 'shift') return { ...FIXED.shift, pressed: shift === 'once' };
    if (key.type === 'caps') return { ...FIXED.caps, pressed: shift === 'caps' };
    if (key.type === 'altgr') return { ...FIXED.altgr, pressed: altGr };
    if (key.type === 'numlock') return { ...FIXED.numlock, pressed: numLock };
    return FIXED[key.type];
  };

  return {
    layer,
    shift,
    altGr,
    numLock,
    rows: /** @type {Key[][]} */ (layers.get(layer)),
    press,
    describe,
  };
}
