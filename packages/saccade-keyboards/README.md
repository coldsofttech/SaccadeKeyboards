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

| Prop          | Meaning                                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `language`    | The language code, such as `en`. Loaded the first time it is needed.                                                                                                                     |
| `layout`      | Your own layout instead of `language` (see the layout format in the repository's docs).                                                                                                  |
| `onKey`       | Called with `{ type: 'text', value }`, `{ type: 'backspace' }` or `{ type: 'enter' }`.                                                                                                   |
| `onClose`     | Called when the hide key is pressed.                                                                                                                                                     |
| `theme`       | `'light'` (default), `'dark'`, or colours: `background`, `key`, `keyText`, `border`, `accent`, `accentText`.                                                                             |
| `label`       | The name of the keyboard for a screen reader.                                                                                                                                            |
| `font`        | The font of the keys: `'native'` (default, the device's own font), `'sans'`, `'serif'`, `'mono'`.                                                                                        |
| `numpad`      | Show a number pad beside the keys (false): Num Lock and the operators, the digits, a tall plus and Enter. Num Lock starts on; while it is off the digits and the decimal key do nothing. |
| `currencypad` | Add a currency key before the space key (false). It shows or hides a row of currency signs above the keys; the rest of the layout stays as it is.                                        |
| `fontSize`    | The size of the letters on the keys, in pixels (16).                                                                                                                                     |
| `fallback`    | What to show while a language loads.                                                                                                                                                     |

## Styling

Import `@coldsofttech/saccade-keyboards/style.css` once, then change the look with props.

**Light or dark**

```jsx
<Keyboard language="en" onKey={onKey} theme="dark" />
```

**Your own colours.** Pass any of the colours; the ones you leave out keep the light theme's colour.

```jsx
<Keyboard
  language="en"
  onKey={onKey}
  theme={{
    background: '#1b2a41',
    key: '#324a5f',
    keyText: '#ffffff',
    border: '#0c1821',
    accent: '#ccc9dc',
    accentText: '#0c1821',
  }}
/>
```

| Colour       | Where it shows                                |
| ------------ | --------------------------------------------- |
| `background` | Behind the keys.                              |
| `key`        | A key.                                        |
| `keyText`    | The letters on a key.                         |
| `border`     | The edge of a key.                            |
| `accent`     | A key that is on, such as Shift or Caps Lock. |
| `accentText` | The letters on a key that is on.              |

**Font and size.** `font` takes `'native'`, `'sans'`, `'serif'`, `'mono'`, or any CSS font list. `fontSize` is in pixels.

```jsx
<Keyboard language="en" onKey={onKey} font={'"Atkinson Hyperlegible", sans-serif'} fontSize={20} />
```

**Width and position.** The keyboard fills the width of the space it is placed in, so to set its width or position, put it in an element of your own and style that.

```jsx
<div style={{ width: 600 }}>
  <Keyboard language="en" onKey={onKey} />
</div>;

{
  /* or responsive, centred */
}
<div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
  <Keyboard language="en" onKey={onKey} />
</div>;
```

**Minimum width.** Narrower than this the keys are too small for their letters and would overlap, so the keyboard does not shrink below it (at the default `fontSize` of 16):

| Keyboard      | Minimum width |
| ------------- | ------------- |
| Keys only     | 430 px        |
| With `numpad` | 600 px        |

In a narrower space it keeps this width and runs past the edge, so give it a wide enough element (or let the element scroll sideways on small screens).

**Narrow keyboards.** At 800 px wide or less the keys are small, with or without the number pad, so each key shows only the character it types. The Shift symbols (like `!` above the `1`) and the small AltGr characters appear when you press Shift or AltGr. Wider than 800 px, every key shows all of its characters.

## Loading languages

Each language is its own package, and `registerLanguage` takes a function that imports it. The package is only downloaded when the keyboard first needs that language, so your app does not carry the languages it does not use. Pass `fallback` to show something while it loads.

```jsx
registerLanguage('en', () => import('@coldsofttech/saccade-en'));
registerLanguage('fr', () => import('@coldsofttech/saccade-fr'));

<Keyboard language="fr" onKey={onKey} fallback={<p>Loading keyboard…</p>} />;
```

## Build your own

`@coldsofttech/saccade-keyboards/core` has what you need without the language loader:

- `Keyboard`: the same keyboard for a `layout` object.
- `useKeyboard`: the state and behaviour without markup, to draw the keys yourself.
- `applyKey`: applies a key press to text and a selection.
- `validateLayout`: lists what is wrong with a layout.
- `Layout`: the type of a layout, for packages that provide one.
- `keys`, `cased`, `physicalRows`, `numpadRows`, `bottomRow`, `symbolsLayer`, `shiftKey`, `capsKey`, `altGrKey`, `backspaceKey`, `PUNCTUATION_NAMES`: helpers to write layouts.

`registerLanguage(id, loader)`, `languages()` and `loadLayout(id)` from the main entry let you add a language by its code.

## License

MIT
