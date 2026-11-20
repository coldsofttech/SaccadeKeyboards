import { defineElement } from './element/define.js';
import css from './style.css.js';
import { createKeyboard } from './vanilla/createKeyboard.js';

/**
 * Registers `<saccade-keyboard>`, the on-screen keyboard as a Web Component. Importing this file
 * registers it; call this to register it again under another tag.
 *
 * Properties: `layout` (a layout object; the keyboard waits for it), and `theme` (also an object of
 * colours). Attributes: `theme` (`light` or `dark`), `label`, `font`, `font-size`, `numpad` and
 * `currencypad` (both off unless the attribute is there). Events, with the argument in `detail`:
 * `saccade-key` (`{ type, value? }`) and `saccade-close`. The events bubble out of the shadow root.
 */
export const defineKeyboardElement = defineElement({
  tag: 'saccade-keyboard',
  create: createKeyboard,
  css,
  ready: (props) => Boolean(props.layout),
  attributes: {
    theme: 'theme',
    label: 'label',
    font: 'font',
    'font-size': ['fontSize', 'number'],
    numpad: ['numpad', 'boolean'],
    currencypad: ['currencypad', 'boolean'],
  },
  properties: ['layout'],
  events: { onKey: 'saccade-key', onClose: 'saccade-close' },
});

defineKeyboardElement();
