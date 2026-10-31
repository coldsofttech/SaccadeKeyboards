# @coldsofttech/saccade-en

The English keyboard for [`@coldsofttech/saccade-keyboards`](../saccade-keyboards), with letters, numbers and symbols. Letters can be in QWERTY order (the default) or in alphabetical order.

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

`createLayout(type)` takes `'qwerty'` (default) or `'alphabetical'`.
