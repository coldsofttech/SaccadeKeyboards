import { registerLanguage } from '@coldsofttech/saccade-keyboards/core';

// Makes `language="fr"` work: the layout is loaded the first time a keyboard asks for it.
registerLanguage('fr', () => import('./index.js'));
