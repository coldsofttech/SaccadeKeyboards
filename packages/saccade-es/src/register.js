import { registerLanguage } from '@coldsofttech/saccade-keyboards/core';

// Makes `language="es"` work: the layout is loaded the first time a keyboard asks for it.
registerLanguage('es', () => import('./index.js'));
