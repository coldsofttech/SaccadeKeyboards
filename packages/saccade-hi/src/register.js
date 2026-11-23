import { registerLanguage } from '@coldsofttech/saccade-keyboards/core';

// Makes `language="hi"` work: the layout is loaded the first time a keyboard asks for it.
registerLanguage('hi', () => import('./index.js'));
