# @coldsofttech/saccade-en

The English keyboard for [`@coldsofttech/saccade-keyboards`](../saccade-keyboards), laid out like a physical keyboard: a number row with its symbols, Caps Lock, two Shift keys, a tall Enter on British keyboards, and a bottom row with the space bar. The AltGr key types what the keyboard of the region types with it: the United States-International characters (accents, ñ, €, ¥, © and more) for the US, Australia and Canada, € ¦ and the accented vowels for Britain, and ₹ for India. Letters can be in QWERTY order (the default) or in alphabetical order.

```bash
npm install @coldsofttech/saccade-keyboards @coldsofttech/saccade-en
```

## Use it

```jsx
import { Keyboard, registerLanguage } from '@coldsofttech/saccade-keyboards';

registerLanguage('en', () => import('@coldsofttech/saccade-en'));

<Keyboard language="en" onKey={handleKey} />;
```

## Alphabetical order

```jsx
import { Keyboard } from '@coldsofttech/saccade-keyboards';
import { createLayout } from '@coldsofttech/saccade-en';

<Keyboard layout={createLayout('alphabetical')} onKey={handleKey} />;
```

`createLayout(type, region)` takes the letter order, `'qwerty'` (default) or `'alphabetical'`, and the country: `'US'` (default), `'GB'` (`'UK'` also works), `'AU'`, `'CA'` or `'IN'`.

```jsx
<Keyboard layout={createLayout('qwerty', 'GB')} onKey={handleKey} />
```

The country sets the language tag (`en-GB`), sets the physical keys (a British keyboard has a tall Enter and `"` above `2`) and what AltGr types.
