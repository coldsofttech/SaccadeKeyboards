// Web Component: importing the keyboard's /element registers <saccade-keyboard>.
import '@coldsofttech/saccade-keyboards/element';

// Plain JavaScript: call the keyboard's function with an element, and import its stylesheet.
import { createKeyboard, registerLanguage } from '@coldsofttech/saccade-keyboards/vanilla';
import { applyKey } from '@coldsofttech/saccade-keyboards/core';
import '@coldsofttech/saccade-keyboards/style.css';

// Languages: importing a package's /register entry makes its code work. Registering by hand does
// the same, and nothing is loaded until a keyboard asks for the language.
import '@coldsofttech/saccade-en/register';
registerLanguage('ur', () => import('@coldsofttech/saccade-ur'));

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

// The element: `language="en"` is in the markup; each key comes out as an event.
const element = document.getElementById('element');
element.addEventListener('saccade-key', (event) => type(event.detail));
element.addEventListener('saccade-close', () => console.log('hide'));

// The function: the same keyboard drawn into an ordinary element.
const keyboard = createKeyboard(document.getElementById('host'), {
  language: 'en',
  fallback: 'Loading keys',
  onError: (error) => console.error(error),
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

// Change the language of both keyboards. An unknown code shows which package to install.
document.getElementById('language').addEventListener('change', (event) => {
  const code = event.target.value;
  element.setAttribute('language', code);
  keyboard.update({ language: code });
});
