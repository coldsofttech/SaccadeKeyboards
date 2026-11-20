import { useState, useSyncExternalStore } from 'react';
import { createKeyboardModel } from './core/model.js';

export { CURRENCY_SIGNS, typedValue } from './core/typed.js';

/** @typedef {import('./core/layout.js').Key} Key */
/** @typedef {import('./core/layout.js').Layout} Layout */
/** @typedef {import('./core/applyKey.js').KeyPress} KeyPress */
/** @typedef {import('./core/model.js').KeyDescription} KeyDescription */

/**
 * @typedef {object} UseKeyboardOptions
 * @property {Layout} layout The layout to drive.
 * @property {(key: KeyPress) => void} onKey A key was pressed (the space key types a space).
 * @property {() => void} [onClose] The hide key was pressed.
 */

/**
 * The state and behaviour of an on-screen keyboard, without any markup, so a custom UI can render
 * the keys itself. It runs `createKeyboardModel` (from `@coldsofttech/saccade-keyboards/core`), the
 * same rules the keyboard element uses. Shift is `'off'`, `'once'` (the next key, from the shift
 * key) or `'caps'` (from the caps lock key). AltGr is on for the next key only, like shift. Num Lock
 * starts on; while it is off the keys of the number pad do nothing.
 *
 * @param {UseKeyboardOptions} options Layout and callbacks.
 * @returns {{
 *   layer: string,
 *   shift: 'off' | 'once' | 'caps',
 *   altGr: boolean,
 *   numLock: boolean,
 *   currencyOpen: boolean,
 *   rows: Key[][],
 *   press: (key: Key) => void,
 *   describe: (key: Key) => KeyDescription,
 * }} What to render and how to react.
 */
export function useKeyboard({ layout, onKey, onClose }) {
  const [model] = useState(() => createKeyboardModel({ layout, onKey, onClose }));
  // The model is read in this render, so a new layout and new callbacks are in it before it is. Both
  // are the same value on a second render, so this does nothing twice.
  model.setLayout(layout, { silent: true });
  model.setCallbacks({ onKey, onClose });
  const state = useSyncExternalStore(model.subscribe, model.getState, model.getState);
  return { ...state, press: model.press, describe: model.describe };
}
