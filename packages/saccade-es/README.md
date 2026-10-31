# @coldsofttech/saccade-es

The Spanish keyboard for [`@coldsofttech/saccade-keyboards`](../saccade-keyboards), with letters including ñ, a layer of accented vowels (á é í ó ú ü), and numbers and symbols including ¿ ¡ and €. Letters can be in QWERTY order (the default) or in alphabetical order.

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

`createLayout(type)` takes `'qwerty'` (default) or `'alphabetical'`.
