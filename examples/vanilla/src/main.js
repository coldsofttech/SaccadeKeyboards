// Web Component: importing the keyboard's /element registers <saccade-keyboard>.
import '@coldsofttech/saccade-keyboards/element';

// Plain JavaScript: call the keyboard's function with an element, and import its stylesheet.
import { createKeyboard } from '@coldsofttech/saccade-keyboards/vanilla';
import { applyKey } from '@coldsofttech/saccade-keyboards/core';
import '@coldsofttech/saccade-keyboards/style.css';

import { layout as english } from '@coldsofttech/saccade-en';

const field = document.getElementById('field');

/** Types a key into the text field at its caret. The keyboard only says which key was pressed. */
function type(key) {
  const { text, selection } = applyKey(
    field.value,
    { start: field.selectionStart, end: field.selectionEnd },
    key,
  );
  field.value = text;
  field.setSelectionRange(selection.start, selection.end);
}

// The element: a layout goes in the `layout` property, and each key comes out as an event.
const element = document.getElementById('element');
element.layout = english;
element.addEventListener('saccade-key', (event) => type(event.detail));
element.addEventListener('saccade-close', () => console.log('hide'));

// The function: the same keyboard drawn into an ordinary element.
const keyboard = createKeyboard(document.getElementById('host'), {
  layout: english,
  onKey: type,
  currencypad: true,
});

let dark = false;
document.getElementById('theme').addEventListener('click', () => {
  dark = !dark;
  if (dark) element.setAttribute('theme', 'dark');
  else element.removeAttribute('theme');
  keyboard.update({ theme: dark ? 'dark' : 'light' });
});

let numpad = false;
document.getElementById('numpad').addEventListener('click', () => {
  numpad = !numpad;
  if (numpad) element.setAttribute('numpad', '');
  else element.removeAttribute('numpad');
  keyboard.update({ numpad });
});
