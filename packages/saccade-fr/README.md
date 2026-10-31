# @coldsofttech/saccade-fr

The French keyboard for [`@coldsofttech/saccade-keyboards`](../saccade-keyboards), laid out like a physical keyboard of France, Belgium, Canada or Switzerland: a number row with its symbols (on a French keyboard the digits need Shift), the accented letters é è ç à ù on their own keys, Caps Lock, two Shift keys and a tall Enter. The AltGr key types the characters a French keyboard has under AltGr (@ # { [ | ` \ ^ ] } ~ €). It also types the circumflex and diaeresis letters (â ê î ô û ë ï ü ÿ), œ, æ and the guillemets « », which a real keyboard types with a dead key. Letters can be in the order of the region (the default) or in alphabetical order.

```bash
npm install @coldsofttech/saccade-keyboards @coldsofttech/saccade-fr
```

## Use it

```jsx
import { Keyboard, registerLanguage } from '@coldsofttech/saccade-keyboards';

registerLanguage('fr', () => import('@coldsofttech/saccade-fr'));

<Keyboard language="fr" onKey={handleKey} />;
```

## Other countries and alphabetical order

```jsx
import { Keyboard } from '@coldsofttech/saccade-keyboards';
import { createLayout } from '@coldsofttech/saccade-fr';

<Keyboard layout={createLayout('azerty', 'CA')} onKey={handleKey} />;
<Keyboard layout={createLayout('alphabetical')} onKey={handleKey} />;
```

`createLayout(type, region)` takes the letter order, `'azerty'` (default, the order of the region: AZERTY, or QWERTY in Canada and QWERTZ in Switzerland) or `'alphabetical'`, and the country: `'FR'` (default), `'BE'`, `'CA'` or `'CH'`.

The country sets the language tag (`fr-CA`), the physical keys, what AltGr types and the decimal sign of the number pad (`,` except in Switzerland).
