import styles from './Keyboard.module.css';
import { useKeyboard } from './useKeyboard.js';

/** @typedef {import('./layout.js').Layout} Layout */
/** @typedef {import('./applyKey.js').KeyPress} KeyPress */

/**
 * Colours for a custom theme. Anything left out keeps the light theme's colour.
 *
 * @typedef {object} ThemeColors
 * @property {string} [background] Behind the keys.
 * @property {string} [key] A key.
 * @property {string} [keyText] Text on a key.
 * @property {string} [border] Edge of a key.
 * @property {string} [accent] A key that is on, such as shift.
 * @property {string} [accentText] Text on a key that is on.
 */

/**
 * @typedef {object} KeyboardProps
 * @property {Layout} layout The layout; the first layer is shown first.
 * @property {(key: KeyPress) => void} onKey A key was pressed (the space key types a space).
 * @property {() => void} [onClose] The hide key was pressed.
 * @property {'light' | 'dark' | ThemeColors} [theme] Colours of the keyboard ('light').
 * @property {string} [label] The name of the keyboard for a screen reader.
 * @property {string} [font] The font of the keys: `native` (the device's own font), `sans`, `serif`,
 *   `mono`, or any CSS font-family list, such as `"Atkinson Hyperlegible", sans-serif` ('native').
 * @property {number} [fontSize] The size of the letters on the keys, in pixels (16).
 */

const TOKENS = new Map([
  ['background', '--saccade-background'],
  ['key', '--saccade-key'],
  ['keyText', '--saccade-key-text'],
  ['border', '--saccade-border'],
  ['accent', '--saccade-accent'],
  ['accentText', '--saccade-accent-text'],
]);

/** Fonts every device has, so nothing is bundled and no font licence is involved. */
const FONTS = new Map([
  ['native', 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'],
  ['sans', 'ui-sans-serif, "Helvetica Neue", Arial, sans-serif'],
  ['serif', 'ui-serif, Georgia, "Times New Roman", serif'],
  ['mono', 'ui-monospace, "SF Mono", Consolas, "Liberation Mono", monospace'],
]);

/** @param {KeyboardProps['theme']} theme */
function themeProps(theme) {
  if (theme !== null && typeof theme === 'object') {
    const entries = Object.entries(theme).flatMap(([name, value]) =>
      TOKENS.has(name) ? [[TOKENS.get(name), value]] : [],
    );
    return { className: styles.root, style: Object.fromEntries(entries) };
  }
  return { className: theme === 'dark' ? `${styles.root} ${styles.dark}` : styles.root };
}

/**
 * @param {{ className: string, style?: Record<string, string> }} props Theme props.
 * @param {string} font The `font` prop.
 */
function withFont(props, font) {
  return { ...props, style: { ...props.style, fontFamily: FONTS.get(font) ?? font } };
}

/**
 * An on-screen keyboard for a layout. It edits nothing: it says which key was pressed, and
 * whoever uses it types into its own field (see `applyKey`). Pressing a key keeps the focus where
 * it was.
 *
 * @param {KeyboardProps} props Component props.
 * @returns {import('react').JSX.Element} The keyboard.
 */
export function Keyboard({
  layout,
  onKey,
  onClose,
  theme = 'light',
  label,
  font = 'native',
  fontSize = 16,
}) {
  const { rows, shift, press, describe } = useKeyboard({ layout, onKey, onClose });

  return (
    // The keys sit where the physical keys are, left to right, whatever way the language reads.
    <div
      role="group"
      aria-label={label ?? `${layout.name} on-screen keyboard`}
      lang={layout.id}
      dir="ltr"
      {...withFont(themeProps(theme), font)}
    >
      {rows.map((row, r) => (
        <div key={r} className={styles.row}>
          {row.map((key, k) => {
            const { label: text, name, pressed } = describe(key);
            return (
              <button
                key={k}
                type="button"
                aria-label={name}
                aria-pressed={pressed}
                className={
                  key.type === 'shift' && shift !== 'off'
                    ? `${styles.key} ${styles.active}`
                    : styles.key
                }
                style={{ fontSize, flexGrow: key.width ?? 1 }}
                // Keep the focus (and the caret) in the field being typed into.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => press(key)}
              >
                {text}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
