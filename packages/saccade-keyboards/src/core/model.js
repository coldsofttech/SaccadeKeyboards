import { PUNCTUATION_NAMES } from './layout.js';
import { typedValue } from './typed.js';

/** @typedef {import('./layout.js').Key} Key */
/** @typedef {import('./layout.js').Layout} Layout */
/** @typedef {import('./applyKey.js').KeyPress} KeyPress */

/**
 * @typedef {object} KeyDescription
 * @property {string} label Text to show on the key; the icon of a control key.
 * @property {string} [caption] Text to show under the icon of a control key, such as `Shift`.
 * @property {string} name What a screen reader says.
 * @property {boolean} [pressed] Whether the key is on, for the shift, caps lock, AltGr and Num Lock keys.
 * @property {boolean} [disabled] Whether the key is off, for the number pad while Num Lock is off.
 */

/**
 * What to draw. A new object each time something changes, so a framework can compare snapshots.
 *
 * @typedef {object} KeyboardState
 * @property {string} layer The layer shown.
 * @property {'off' | 'once' | 'caps'} shift `once` is the next key (the shift key), `caps` is caps lock.
 * @property {boolean} altGr On for the next key only, like shift.
 * @property {boolean} numLock Starts on; while it is off the keys of the number pad do nothing.
 * @property {boolean} currencyOpen Whether the row of currency signs is shown.
 * @property {Key[][]} rows The rows of the layer shown.
 */

/**
 * @typedef {object} KeyboardCallbacks
 * @property {(key: KeyPress) => void} [onKey] A key was pressed (the space key types a space).
 * @property {() => void} [onClose] The hide key was pressed.
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
  currency: { label: '$£€', caption: 'Currency', name: 'Currency symbols' },
};

// A sign that only sits on a letter (a vowel sign, a virama) is shown on a dotted circle.
/** @param {string} value */
const shown = (value) => (/^\p{M}$/u.test(value) ? `◌${value}` : value);

/**
 * The state and behaviour of an on-screen keyboard, without any markup and without any framework, so
 * the React hook, the Web Component and a custom UI all run the same rules. Shift is `'off'`,
 * `'once'` (the next key, from the shift key) or `'caps'` (from the caps lock key). AltGr is on for
 * the next key only, like shift. Num Lock starts on; while it is off the keys of the number pad do
 * nothing.
 *
 * @param {{ layout: Layout } & KeyboardCallbacks} options The layout and the callbacks.
 * @returns {{
 *   layout: Layout,
 *   getState: () => KeyboardState,
 *   subscribe: (listener: () => void) => () => void,
 *   press: (key: Key) => void,
 *   describe: (key: Key) => KeyDescription,
 *   setLayout: (layout: Layout, options?: { silent?: boolean }) => void,
 *   setCallbacks: (callbacks: KeyboardCallbacks) => void,
 * }} The model.
 */
export function createKeyboardModel({ layout: initial, onKey, onClose }) {
  let layout = initial;
  /** @type {KeyboardCallbacks} */
  let callbacks = { onKey, onClose };
  let chosen = '';
  /** @type {'off' | 'once' | 'caps'} */
  let shift = 'off';
  let altGr = false;
  let numLock = true;
  let currencyOpen = false;
  /** @type {Set<() => void>} */
  const listeners = new Set();
  /** @type {Map<string, string>} */
  let names = new Map();
  /** @type {KeyboardState | null} */
  let snapshot = null;

  const namesOf = () => new Map(Object.entries({ ...PUNCTUATION_NAMES, ...layout.names }));
  names = namesOf();

  /** The state to draw. A layout without the chosen layer falls back to its first layer. */
  function build() {
    const layers = new Map(Object.entries(layout.layers));
    const layer = layers.has(chosen) ? chosen : [...layers.keys()][0];
    return {
      layer,
      shift,
      altGr,
      numLock,
      currencyOpen,
      rows: /** @type {Key[][]} */ (layers.get(layer)),
    };
  }

  /** Makes a new snapshot and tells the listeners. */
  function changed() {
    snapshot = build();
    for (const listener of [...listeners]) listener();
  }

  // Caps lock capitalises letters only; a key such as a digit keeps its character without shift.
  /** @param {import('./layout.js').TextKey} key */
  const isShifted = (key) =>
    shift === 'once' || (shift === 'caps' && key.shift === key.value.toUpperCase());

  return {
    get layout() {
      return layout;
    },
    getState() {
      snapshot ??= build();
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    press(key) {
      if (key.type === 'text' && key.numpad && !numLock) return;
      switch (key.type) {
        case 'text':
          callbacks.onKey?.({
            type: 'text',
            value: typedValue(key, isShifted(key), altGr, shift === 'caps'),
          });
          if (shift === 'once') shift = 'off';
          altGr = false;
          break;
        case 'space':
          callbacks.onKey?.({ type: 'text', value: ' ' });
          if (shift === 'once') shift = 'off';
          altGr = false;
          break;
        case 'shift':
          shift = shift === 'off' ? 'once' : 'off';
          break;
        case 'altgr':
          altGr = !altGr;
          break;
        case 'numlock':
          numLock = !numLock;
          break;
        case 'currency':
          currencyOpen = !currencyOpen;
          break;
        case 'caps':
          shift = shift === 'caps' ? 'off' : 'caps';
          break;
        case 'layer':
          chosen = key.to;
          shift = 'off';
          altGr = false;
          break;
        case 'close':
          callbacks.onClose?.();
          break;
        default:
          callbacks.onKey?.({ type: key.type });
      }
      changed();
    },
    describe(key) {
      if (key.type === 'text') {
        const value = typedValue(key, isShifted(key), altGr, shift === 'caps');
        const description = { label: shown(value), name: names.get(value) ?? value };
        return key.numpad ? { ...description, disabled: !numLock } : description;
      }
      if (key.type === 'layer') return { label: key.label, name: key.name ?? key.label };
      if (key.type === 'shift') return { ...FIXED.shift, pressed: shift === 'once' };
      if (key.type === 'caps') return { ...FIXED.caps, pressed: shift === 'caps' };
      if (key.type === 'altgr') return { ...FIXED.altgr, pressed: altGr };
      if (key.type === 'numlock') return { ...FIXED.numlock, pressed: numLock };
      if (key.type === 'currency') return { ...FIXED.currency, pressed: currencyOpen };
      return FIXED[key.type];
    },
    setLayout(next, { silent = false } = {}) {
      if (next === layout) return;
      layout = next;
      names = namesOf();
      if (silent) snapshot = build();
      else changed();
    },
    setCallbacks(next) {
      callbacks = next;
    },
  };
}
