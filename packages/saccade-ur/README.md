# @coldsofttech/saccade-ur

The Urdu keyboard for [`@coldsofttech/saccade-keyboards`](../saccade-keyboards), written right to left, in two layouts: **standard**, the usual Urdu key map with a second letter on Shift (for example ا and آ, ت and ٹ), and **phonetic**, where each key types the Urdu letter that sounds like the Latin letter on it. Both have a second layer with the diacritics (zabar, zer, pesh, shadda, jazm) and Urdu punctuation.

The number row types Latin digits (0-9) with the Urdu digits (۰-۹) on AltGr, or the other way round.

```bash
npm install @coldsofttech/saccade-keyboards @coldsofttech/saccade-ur
```

## Use it

```jsx
import { Keyboard, registerLanguage } from '@coldsofttech/saccade-keyboards';

registerLanguage('ur', () => import('@coldsofttech/saccade-ur'));

<Keyboard language="ur" onKey={handleKey} />;
```

## Phonetic and Urdu digits

```jsx
import { createLayout } from '@coldsofttech/saccade-ur';

<Keyboard layout={createLayout('phonetic')} onKey={handleKey} />;
<Keyboard layout={createLayout('standard', 'urdu')} onKey={handleKey} />;
```

`createLayout(type, digits)` takes the keyboard, `'standard'` (default) or `'phonetic'`, and the digits of the number row, `'latin'` (default) or `'urdu'`.
