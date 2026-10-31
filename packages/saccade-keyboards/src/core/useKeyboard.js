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
 * @property {string} label Text to show on the key.
 * @property {string} name What a screen reader says.
 * @property {boolean} [pressed] Whether the key is on, for the shift key.
 */

/** @type {Record<string, KeyDescription>} */
const FIXED = {
  shift: { label: '⇧', name: 'Shift' },
  backspace: { label: '⌫', name: 'Backspace' },
  enter: { label: '⏎', name: 'Enter' },
  space: { label: 'space', name: 'Space' },
  close: { label: '⌄', name: 'Hide keyboard' },
};

/**
 * What a text key types: its shifted character while shift is on, if it has one.
 *
 * @param {import('./layout.js').TextKey} key The key.
 * @param {boolean} shifted Whether shift is on.
 * @returns {string} The character.
 */
export function typedValue(key, shifted) {
  return shifted && key.shift ? key.shift : key.value;
}

// A sign that only sits on a letter (a vowel sign, a virama) is shown on a dotted circle.
/** @param {string} value */
const shown = (value) => (/^\p{M}$/u.test(value) ? `◌${value}` : value);

/**
 * The state and behaviour of an on-screen keyboard, without any markup, so a custom UI can render
 * the keys itself. Shift is `'off'`, `'once'` (the next key) or `'caps'`.
 *
 * @param {UseKeyboardOptions} options Layout and callbacks.
 * @returns {{
 *   layer: string,
 *   shift: 'off' | 'once' | 'caps',
 *   rows: Key[][],
 *   press: (key: Key) => void,
 *   describe: (key: Key) => KeyDescription,
 * }} What to render and how to react.
 */
export function useKeyboard({ layout, onKey, onClose }) {
  const [chosen, setChosen] = useState('');
  const [shift, setShift] = useState(/** @type {'off' | 'once' | 'caps'} */ ('off'));
  // Fall back to the first layer when the layout changes to one without the chosen layer.
  const layers = new Map(Object.entries(layout.layers));
  const layer = layers.has(chosen) ? chosen : [...layers.keys()][0];
  /** @type {Map<string, string>} */
  const names = new Map(Object.entries({ ...PUNCTUATION_NAMES, ...layout.names }));

  /** @param {Key} key */
  const press = (key) => {
    switch (key.type) {
      case 'text':
        onKey({ type: 'text', value: typedValue(key, shift !== 'off') });
        if (shift === 'once') setShift('off');
        break;
      case 'space':
        onKey({ type: 'text', value: ' ' });
        if (shift === 'once') setShift('off');
        break;
      case 'shift':
        setShift(shift === 'off' ? 'once' : shift === 'once' ? 'caps' : 'off');
        break;
      case 'layer':
        setChosen(key.to);
        setShift('off');
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
      const value = typedValue(key, shift !== 'off');
      return { label: shown(value), name: names.get(value) ?? value };
    }
    if (key.type === 'layer') return { label: key.label, name: key.name ?? key.label };
    if (key.type === 'shift') {
      return {
        label: shift === 'caps' ? '⇪' : FIXED.shift.label,
        name: shift === 'caps' ? 'Caps lock' : FIXED.shift.name,
        pressed: shift !== 'off',
      };
    }
    return FIXED[key.type];
  };

  return { layer, shift, rows: /** @type {Key[][]} */ (layers.get(layer)), press, describe };
}
