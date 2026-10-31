# Layout format

A keyboard layout is plain data. The keyboard draws it and handles the key presses, so adding a language never needs a change to the engine. A layout has no rendering code.

```js
export const layout = {
  id: 'hi',
  name: 'Hindi',
  dir: 'ltr',
  fonts: ['Noto Sans Devanagari'],
  layers: { letters: [/* rows */], symbols: [/* rows */] },
  names: { '।': 'danda' },
};
```

| Field     | Required | Meaning                                                                                                     |
| --------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `id`      | Yes      | Language code. It becomes the `lang` of the keyboard and the package name, `@coldsofttech/saccade-<id>`.    |
| `name`    | Yes      | Name of the language, used for the default label "`<name>` on-screen keyboard".                             |
| `dir`     | Yes      | Reading direction, `ltr` or `rtl`. The keys themselves always sit left to right, like the physical keys.    |
| `fonts`   | No       | Font families the keys need. Fonts are never bundled; the app loads them and the layout package lists them. |
| `layers`  | Yes      | Layer name to rows of keys. The first layer is shown first.                                                 |
| `decimal` | No       | The sign of the decimal key of the number pad (`.`). Spain, for one, uses `,`.                              |
| `names`   | No       | What a screen reader says for a character, merged over the built-in punctuation names.                      |

## Keys

A row is a list of keys. `width` is the share of the row a key takes; 1 is an ordinary key. A row always fills the width of the keyboard. `rowSpan` makes a key taller: `{ type: 'enter', rowSpan: 2 }` at the end of a row also covers the row below, which then shares only the space that is left. Use it for a tall Enter at the start or the end of a row.

| Key                                                 | What it does                                                                                                                                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ type: 'text', value, shift?, altgr?, capital? }` | Types `value`; `shift` while shift is on, or `altgr` after AltGr (capitalised with shift if it is a letter), or `capital` while caps lock is on (É on the é key of a French keyboard, which types 2 with shift). |
| `{ type: 'shift' }`                                 | Shift: capitals for the next key only.                                                                                                                                                                           |
| `{ type: 'caps' }`                                  | Caps lock: capitals until it is pressed again.                                                                                                                                                                   |
| `{ type: 'numlock' }`                               | Num Lock of the number pad: its `numpad` keys are off while it is off.                                                                                                                                           |
| `{ type: 'altgr' }`                                 | AltGr: the next key types its `altgr` character.                                                                                                                                                                 |
| `{ type: 'space' }`                                 | Types a space.                                                                                                                                                                                                   |
| `{ type: 'backspace' }`, `{ type: 'enter' }`        | Reported through `onKey` for the app to apply.                                                                                                                                                                   |
| `{ type: 'close' }`                                 | Calls `onClose`.                                                                                                                                                                                                 |
| `{ type: 'layer', to, label, name? }`               | Shows another layer and turns shift off.                                                                                                                                                                         |

The `currencypad` prop of `Keyboard` adds a currency key before every space key at render time, taking 1 unit of the space key's width, so layouts never include it. It shows or hides a row of currency signs above the keys.

A sign that only sits on a letter, such as a vowel sign or a virama, is shown on a dotted circle automatically.

## Helpers

`@coldsofttech/saccade-keyboards/core` exports helpers to write layouts briefly: `keys`, `cased`, `physicalRows`, `numpadRows`, `bottomRow`, `symbolsLayer`, `shiftKey`, `capsKey`, `altGrKey`, `backspaceKey` and `PUNCTUATION_NAMES`.

## Checking a layout

`validateLayout(layout)` returns a list of problems, empty when the layout is valid. Every layout package should assert this in its tests. The `language` prop of the meta `Keyboard` runs it as well and shows the problems instead of a broken keyboard.

## Adding a language

1. Create a package `@coldsofttech/saccade-<id>` that exports the layout as `layout` and depends on `@coldsofttech/saccade-keyboards` as a peer.
2. Add a test that runs `validateLayout`.
3. List its font (if any) in `fonts` and document how to load it.
4. Apps register it with `registerLanguage('<id>', () => import('@coldsofttech/saccade-<id>'))` so `language="<id>"` finds it, or pass the layout through the `layout` prop.

`@coldsofttech/saccade-en` is the reference: it exports `layout` (QWERTY) and `createLayout(type, region)`.

Composition rules (conjuncts, vowel signs joining a consonant) are not part of the format yet. A key types exactly its `value`.
