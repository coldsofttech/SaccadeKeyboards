# @coldsofttech/saccade-hi

The Hindi keyboard for [`@coldsofttech/saccade-keyboards`](../saccade-keyboards), in two layouts: **InScript**, the standard keyboard of India (consonants on the right hand, vowels on the left, Shift for the aspirated letters and conjuncts such as ज्ञ and क्ष), and **phonetic**, where each key types the Hindi letter that sounds like the Latin letter on it. The phonetic keyboard has a second layer with the vowel signs (ा ि ी ु ू ृ े ै ो ौ), anusvara, chandrabindu, visarga, halant and nukta.

The number row types Latin digits (0-9) with the Devanagari digits (०-९) on AltGr, or the other way round.

```bash
npm install @coldsofttech/saccade-keyboards @coldsofttech/saccade-hi
```

## Use it

```jsx
import { Keyboard, registerLanguage } from '@coldsofttech/saccade-keyboards';

registerLanguage('hi', () => import('@coldsofttech/saccade-hi'));

<Keyboard language="hi" onKey={handleKey} />;
```

## Phonetic and Devanagari digits

```jsx
import { createLayout } from '@coldsofttech/saccade-hi';

<Keyboard layout={createLayout('phonetic')} onKey={handleKey} />;
<Keyboard layout={createLayout('inscript', 'devanagari')} onKey={handleKey} />;
```

`createLayout(type, digits)` takes the keyboard, `'inscript'` (default) or `'phonetic'`, and the digits of the number row, `'latin'` (default) or `'devanagari'`.

The ₹ sign is on the currency row of the `currencypad` option.
