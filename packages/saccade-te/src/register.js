import { registerLanguage } from '@coldsofttech/saccade-keyboards/core';

// Makes `language="te"` work: the layout is loaded the first time a keyboard asks for it.
registerLanguage('te', () => import('./index.js'));
