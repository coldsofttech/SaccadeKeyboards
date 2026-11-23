import { registerLanguage } from '@coldsofttech/saccade-keyboards/core';

// Makes `language="ur"` work: the layout is loaded the first time a keyboard asks for it.
registerLanguage('ur', () => import('./index.js'));
