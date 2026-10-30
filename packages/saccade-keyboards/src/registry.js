import { validateLayout } from './core/layout.js';

/** @typedef {import('./core/layout.js').Layout} Layout */

/**
 * Loads a layout: a function that imports it, such as `() => import('@coldsofttech/saccade-en')`.
 * It resolves to the layout itself or to a module that exports it as `layout`.
 *
 * @typedef {() => Promise<Layout | { layout: Layout }>} LayoutLoader
 */

/** @type {Map<string, LayoutLoader>} */
const loaders = new Map();

/**
 * Makes a language available to `Keyboard` by its code.
 *
 * @param {string} id The language code, such as `en`.
 * @param {LayoutLoader} loader Imports the layout when it is first needed.
 */
export function registerLanguage(id, loader) {
  loaders.set(id, loader);
}

/**
 * The language codes that can be loaded.
 *
 * @returns {string[]} The codes.
 */
export function languages() {
  return [...loaders.keys()];
}

/**
 * Loads and checks the layout of a language.
 *
 * @param {string} id The language code.
 * @returns {Promise<Layout>} The layout.
 */
export async function loadLayout(id) {
  const loader = loaders.get(id);
  if (!loader) {
    throw new Error(
      `No keyboard for "${id}". Install @coldsofttech/saccade-${id}, or add it with registerLanguage().`,
    );
  }
  const loaded = await loader();
  const layout = 'layout' in loaded ? loaded.layout : loaded;
  const problems = validateLayout(layout);
  if (problems.length > 0) {
    throw new Error(`The keyboard for "${id}" is not a valid layout: ${problems.join('; ')}`);
  }
  return layout;
}
