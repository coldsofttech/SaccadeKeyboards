import { registerLanguage } from '@coldsofttech/saccade-keyboards/core';

// Makes `language="en"` work: the layout is loaded the first time a keyboard asks for it.
registerLanguage('en', () => import('./index.js'));
