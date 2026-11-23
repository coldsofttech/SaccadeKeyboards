import { defineElement } from './element/define.js';
import css from './style.css.js';
import { createKeyboard } from './vanilla/createKeyboard.js';

/**
 * Registers `<saccade-keyboard>`, the on-screen keyboard as a Web Component. Importing this file
 * registers it; call this to register it again under another tag.
 *
 * Properties: `layout` (a layout object) and `theme` (also an object of colours); the keyboard waits
 * for a `layout` or a `language`. Attributes: `language` (a registered code, such as `en`), `fallback`
 * (text shown while it loads), `for` (a selector for the input or textarea to type into; the `field`
 * property takes the element itself), `theme` (`light` or `dark`), `label`, `font`, `font-size`, `numpad` and
 * `currencypad` (both off unless the attribute is there). Events, with the argument in `detail`:
 * `saccade-key` (`{ type, value? }`), `saccade-close`, `saccade-ready` (the layout, once a language has
 * loaded) and `saccade-error` (the `Error`). The events bubble out of the shadow root.
 */
export const defineKeyboardElement = defineElement({
  tag: 'saccade-keyboard',
  create: createKeyboard,
  css,
  ready: (props) => Boolean(props.layout || props.language),
  attributes: {
    language: 'language',
    for: 'field',
    fallback: 'fallback',
    theme: 'theme',
    label: 'label',
    font: 'font',
    'font-size': ['fontSize', 'number'],
    numpad: ['numpad', 'boolean'],
    currencypad: ['currencypad', 'boolean'],
  },
  properties: ['layout'],
  events: {
    onKey: 'saccade-key',
    onClose: 'saccade-close',
    onReady: 'saccade-ready',
    onError: 'saccade-error',
  },
});

defineKeyboardElement();
