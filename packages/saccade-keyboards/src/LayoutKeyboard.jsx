import { createKeyboard } from './vanilla/createKeyboard.js';
import { useController } from './useController.js';

/**
 * @typedef {import('./vanilla/createKeyboard.js').KeyboardProps} KeyboardProps
 * @typedef {import('./vanilla/createKeyboard.js').ThemeColors} ThemeColors
 */

/**
 * An on-screen keyboard for a layout. It edits nothing: it says which key was pressed, and
 * whoever uses it types into its own field (see `applyKey`). Pressing a key keeps the focus where
 * it was. The drawing is done by `createKeyboard` (see `@coldsofttech/saccade-keyboards/vanilla`);
 * this component runs it.
 *
 * @param {KeyboardProps} props Component props.
 * @returns {import('react').JSX.Element} The keyboard.
 */
export function LayoutKeyboard(props) {
  const host = useController(createKeyboard, props);
  return <div ref={host} />;
}
