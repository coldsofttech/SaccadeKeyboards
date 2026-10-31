# @coldsofttech/saccade-keyboards

On-screen keyboards for React. Pick a language, or build your own layout from data. React and `react-dom` 18 or 19 must be installed in your app.

```bash
npm install @coldsofttech/saccade-keyboards
```

## Use it

The keyboard never edits a field. It tells you which key was pressed, and you type into your own field. Pressing a key keeps the focus (and the caret) in that field.

```jsx
import { useRef } from 'react';
import { Keyboard, registerLanguage } from '@coldsofttech/saccade-keyboards';
import { applyKey } from '@coldsofttech/saccade-keyboards/core';
import '@coldsofttech/saccade-keyboards/style.css';

registerLanguage('en', () => import('@coldsofttech/saccade-en'));

function Field() {
  const input = useRef(null);

  const onKey = (key) => {
    const { selectionStart, selectionEnd, value } = input.current;
    const next = applyKey(value, { start: selectionStart, end: selectionEnd }, key);
    input.current.value = next.text;
    input.current.setSelectionRange(next.selection.start, next.selection.end);
  };

  return (
    <>
      <input ref={input} aria-label="Message" />
      <Keyboard language="en" onKey={onKey} />
    </>
  );
}
```

`language` needs that language's package, for example `@coldsofttech/saccade-en` (QWERTY by default; use its `createLayout('alphabetical')` with the `layout` prop for alphabetical letters), and a `registerLanguage` call for it. If the package is missing, the keyboard says which one to install.

## Props

| Prop       | Meaning                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| `language` | The language code, such as `en`. Loaded the first time it is needed.                                         |
| `layout`   | Your own layout instead of `language` (see the layout format in the repository's docs).                      |
| `onKey`    | Called with `{ type: 'text', value }`, `{ type: 'backspace' }` or `{ type: 'enter' }`.                       |
| `onClose`  | Called when the hide key is pressed.                                                                         |
| `theme`    | `'light'` (default), `'dark'`, or colours: `background`, `key`, `keyText`, `border`, `accent`, `accentText`. |
| `label`    | The name of the keyboard for a screen reader.                                                                |
| `font`     | The font of the keys: `'native'` (default, the device's own font), `'sans'`, `'serif'`, `'mono'`.            |
| `fontSize` | The size of the letters on the keys, in pixels (16).                                                         |
| `fallback` | What to show while a language loads.                                                                         |

## Build your own

`@coldsofttech/saccade-keyboards/core` has what you need without the language loader:

- `Keyboard`: the same keyboard for a `layout` object.
- `useKeyboard`: the state and behaviour without markup, to draw the keys yourself.
- `applyKey`: applies a key press to text and a selection.
- `validateLayout`: lists what is wrong with a layout.
- `Layout`: the type of a layout, for packages that provide one.
- `keys`, `cased`, `bottomRow`, `symbolsLayer`, `shiftKey`, `backspaceKey`, `PUNCTUATION_NAMES`: helpers to write layouts.

`registerLanguage(id, loader)`, `languages()` and `loadLayout(id)` from the main entry let you add a language by its code.

## License

MIT
