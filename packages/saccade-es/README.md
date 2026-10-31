# @coldsofttech/saccade-es

The Spanish keyboard for [`@coldsofttech/saccade-keyboards`](../saccade-keyboards), laid out like a physical Spanish or Latin American keyboard: a number row with its symbols (including ¿ and ¡), ñ, Caps Lock, two Shift keys and a tall Enter. The AltGr key types the characters a Spanish or Latin American keyboard has under AltGr (@ # \ [ ] { } ~ | €). It also types the accented vowels (á é í ó ú ü), which a real keyboard types with a dead key. Letters can be in QWERTY order (the default) or in alphabetical order.

```bash
npm install @coldsofttech/saccade-keyboards @coldsofttech/saccade-es
```

## Use it

```jsx
import { Keyboard, registerLanguage } from '@coldsofttech/saccade-keyboards';

registerLanguage('es', () => import('@coldsofttech/saccade-es'));

<Keyboard language="es" onKey={handleKey} />;
```

## Alphabetical order

```jsx
import { Keyboard } from '@coldsofttech/saccade-keyboards';
import { createLayout } from '@coldsofttech/saccade-es';

<Keyboard layout={createLayout('alphabetical')} onKey={handleKey} />;
```

`createLayout(type, region)` takes the letter order, `'qwerty'` (default) or `'alphabetical'`, and the country: `'ES'` (default), `'MX'`, `'AR'`, `'CO'`, `'US'` or `'LATAM'`.

```jsx
<Keyboard layout={createLayout('qwerty', 'MX')} onKey={handleKey} />
```

The country sets the language tag (`es-MX`, or `es-419` for Latin America), sets the physical keys (Spanish or Latin American), what AltGr types and the decimal sign of the number pad (`,` in Spain, Argentina and Colombia).
