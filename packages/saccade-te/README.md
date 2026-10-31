# @coldsofttech/saccade-te

The Telugu keyboard for [`@coldsofttech/saccade-keyboards`](../saccade-keyboards), in two layouts: **InScript**, the standard keyboard of India (consonants on the right hand, vowels on the left, Shift for the aspirated letters and conjuncts such as జ్ఞ and క్ష), and **phonetic**, where each key types the Telugu letter that sounds like the Latin letter on it. The phonetic keyboard has a second layer with the vowel signs (ా ి ీ ు ూ ృ ె ే ై ొ ో ౌ), candrabindu, anusvara, visarga and virama.

The number row types Latin digits (0-9) with the Telugu digits (౦-౯) on AltGr, or the other way round.

```bash
npm install @coldsofttech/saccade-keyboards @coldsofttech/saccade-te
```

## Use it

```jsx
import { Keyboard, registerLanguage } from '@coldsofttech/saccade-keyboards';

registerLanguage('te', () => import('@coldsofttech/saccade-te'));

<Keyboard language="te" onKey={handleKey} />;
```

## Phonetic and Telugu digits

```jsx
import { createLayout } from '@coldsofttech/saccade-te';

<Keyboard layout={createLayout('phonetic')} onKey={handleKey} />;
<Keyboard layout={createLayout('inscript', 'telugu')} onKey={handleKey} />;
```

`createLayout(type, digits)` takes the keyboard, `'inscript'` (default) or `'phonetic'`, and the digits of the number row, `'latin'` (default) or `'telugu'`.
