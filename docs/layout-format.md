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

| Field    | Required | Meaning                                                                                                     |
| -------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `id`     | Yes      | Language code. It becomes the `lang` of the keyboard and the package name, `@coldsofttech/saccade-<id>`.    |
| `name`   | Yes      | Name of the language, used for the default label "`<name>` on-screen keyboard".                             |
| `dir`    | Yes      | Reading direction, `ltr` or `rtl`. The keys themselves always sit left to right, like the physical keys.    |
| `fonts`  | No       | Font families the keys need. Fonts are never bundled; the app loads them and the layout package lists them. |
| `layers` | Yes      | Layer name to rows of keys. The first layer is shown first.                                                 |
| `names`  | No       | What a screen reader says for a character, merged over the built-in punctuation names.                      |

## Keys

A row is a list of keys. `width` is the share of the row a key takes; 1 is an ordinary key.

| Key                                          | What it does                                   |
| -------------------------------------------- | ---------------------------------------------- |
| `{ type: 'text', value, shift? }`            | Types `value`, or `shift` while shift is on.   |
| `{ type: 'shift' }`                          | Shift: off, then the next key, then caps lock. |
| `{ type: 'space' }`                          | Types a space.                                 |
| `{ type: 'backspace' }`, `{ type: 'enter' }` | Reported through `onKey` for the app to apply. |
| `{ type: 'close' }`                          | Calls `onClose`.                               |
| `{ type: 'layer', to, label, name? }`        | Shows another layer and turns shift off.       |

A sign that only sits on a letter, such as a vowel sign or a virama, is shown on a dotted circle automatically.

## Helpers

`@coldsofttech/saccade-keyboards/core` exports helpers to write layouts briefly: `keys`, `cased`, `bottomRow`, `symbolsLayer`, `shiftKey`, `backspaceKey` and `PUNCTUATION_NAMES`.

## Checking a layout

`validateLayout(layout)` returns a list of problems, empty when the layout is valid. Every layout package should assert this in its tests. The `language` prop of the meta `Keyboard` runs it as well and shows the problems instead of a broken keyboard.

## Adding a language

1. Create a package `@coldsofttech/saccade-<id>` that exports the layout as `layout` and depends on `@coldsofttech/saccade-keyboards` as a peer.
2. Add a test that runs `validateLayout`.
3. List its font (if any) in `fonts` and document how to load it.
4. Apps register it with `registerLanguage('<id>', () => import('@coldsofttech/saccade-<id>'))` so `language="<id>"` finds it, or pass the layout through the `layout` prop.

`@coldsofttech/saccade-en` is the reference: it exports `layout` (QWERTY) and `createLayout('qwerty' | 'alphabetical')`.

Composition rules (conjuncts, vowel signs joining a consonant) are not part of the format yet. A key types exactly its `value`.
