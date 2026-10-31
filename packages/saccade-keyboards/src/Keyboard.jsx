import { useEffect, useState } from 'react';
import { Keyboard as CoreKeyboard } from './core/Keyboard.jsx';
import { loadLayout } from './registry.js';

/** @typedef {import('./core/layout.js').Layout} Layout */

/**
 * @typedef {Omit<import('./core/Keyboard.jsx').KeyboardProps, 'layout'> & {
 *   language?: string,
 *   layout?: import('./core/layout.js').Layout,
 *   fallback?: import('react').ReactNode,
 * }} LanguageKeyboardProps
 */

/**
 * An on-screen keyboard picked by language. The layout is loaded the first time it is needed, and
 * a missing one says which package to install. Pass `layout` instead to use your own.
 *
 * @param {LanguageKeyboardProps} props Component props: `language` (a registered code), or
 *   `layout`; `fallback` shows while a layout loads; the rest go to the keyboard.
 * @returns {import('react').ReactNode} The keyboard, the fallback, or the error.
 */
export function Keyboard({ language, layout, fallback = null, ...props }) {
  const [result, setResult] = useState(
    /** @type {{ language: string, layout: Layout | null, error: Error | null }} */ ({
      language: '',
      layout: null,
      error: null,
    }),
  );

  useEffect(() => {
    if (layout || !language) return undefined;
    let current = true;
    loadLayout(language).then(
      (loaded) => current && setResult({ language, layout: loaded, error: null }),
      (error) => current && setResult({ language, layout: null, error }),
    );
    return () => {
      current = false;
    };
  }, [language, layout]);

  const loaded = result.language === language ? result : null;
  const shown = layout ?? loaded?.layout;
  if (shown) return <CoreKeyboard layout={shown} {...props} />;
  if (loaded?.error) return <p role="alert">{loaded.error.message}</p>;
  return fallback;
}
