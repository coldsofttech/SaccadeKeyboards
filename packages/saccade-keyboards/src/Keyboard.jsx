import { useEffect, useRef, useState } from 'react';
import { LayoutKeyboard } from './LayoutKeyboard.jsx';
import { loadLayout } from './core/registry.js';

/** @typedef {import('./core/layout.js').Layout} Layout */

/**
 * @typedef {Omit<import('./LayoutKeyboard.jsx').KeyboardProps, 'layout' | 'language' | 'fallback' | 'onReady' | 'onError'> & {
 *   language?: string,
 *   layout?: import('./core/layout.js').Layout,
 *   fallback?: import('react').ReactNode,
 *   onReady?: (layout: Layout) => void,
 *   onError?: (error: Error) => void,
 * }} LanguageKeyboardProps
 */

/**
 * An on-screen keyboard picked by language. The layout is loaded the first time it is needed, and
 * a missing one says which package to install. Pass `layout` instead to use your own.
 *
 * @param {LanguageKeyboardProps} props Component props: `language` (a registered code), or
 *   `layout`; `fallback` shows while a layout loads; `onReady` and `onError` say how the load ended;
 *   the rest go to the keyboard.
 * @returns {import('react').ReactNode} The keyboard, the fallback, or the error.
 */
export function Keyboard({ language, layout, fallback = null, onReady, onError, ...props }) {
  const [result, setResult] = useState(
    /** @type {{ language: string, layout: Layout | null, error: Error | null }} */ ({
      language: '',
      layout: null,
      error: null,
    }),
  );

  const callbacks = useRef({ onReady, onError });
  useEffect(() => {
    callbacks.current = { onReady, onError };
  });

  useEffect(() => {
    if (layout || !language) return undefined;
    let current = true;
    loadLayout(language).then(
      (loaded) => {
        if (!current) return;
        setResult({ language, layout: loaded, error: null });
        callbacks.current.onReady?.(loaded);
      },
      (error) => {
        if (!current) return;
        setResult({ language, layout: null, error });
        callbacks.current.onError?.(error);
      },
    );
    return () => {
      current = false;
    };
  }, [language, layout]);

  const loaded = result.language === language ? result : null;
  const shown = layout ?? loaded?.layout;
  if (shown) return <LayoutKeyboard layout={shown} {...props} />;
  if (loaded?.error) return <p role="alert">{loaded.error.message}</p>;
  return fallback;
}
