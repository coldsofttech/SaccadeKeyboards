import styles from './Keyboard.module.css';
import { placeKeys } from './grid.js';
import { numpadRows } from './layout.js';
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
 * @property {boolean} [numpad] Show a number pad beside the keys (false). Its decimal key types the
 *   `decimal` of the layout.
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
 * Whether a key has a second character of its own, like the ! above the 1, rather than just the
 * capital of a letter.
 *
 * @param {import('./layout.js').Key} key
 * @returns {key is import('./layout.js').TextKey}
 */
const hasSecondCharacter = (key) =>
  key.type === 'text' && key.shift !== undefined && key.shift !== key.value.toUpperCase();

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
  numpad = false,
  fontSize = 16,
}) {
  const { rows, shift, altGr, press, describe } = useKeyboard({ layout, onKey, onClose });

  /** @param {import('./grid.js').PlacedKey[][]} placed */
  const keysOf = (placed) =>
    placed.flat().map(({ key, column, columnSpan, row, rowSpan }, k) => {
      const { label: text, caption, name, pressed, disabled } = describe(key);
      return (
        <button
          key={k}
          type="button"
          aria-label={name}
          aria-pressed={pressed}
          disabled={disabled}
          className={pressed ? `${styles.key} ${styles.active}` : styles.key}
          style={{
            fontSize,
            gridColumn: `${column} / span ${columnSpan}`,
            gridRow: `${row} / span ${rowSpan}`,
          }}
          // Keep the focus (and the caret) in the field being typed into.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => press(key)}
        >
          {caption ? (
            <span className={styles.stack} aria-hidden="true">
              <span>{text}</span>
              <span className={styles.secondary}>{caption}</span>
            </span>
          ) : altGr && key.type === 'text' && key.altgr ? (
            text
          ) : hasSecondCharacter(key) ? (
            <span className={styles.stack} aria-hidden="true">
              <span className={shift === 'once' ? undefined : styles.secondary}>{key.shift}</span>
              <span className={shift === 'once' ? styles.secondary : undefined}>{key.value}</span>
            </span>
          ) : (
            text
          )}
          {key.type === 'text' && key.altgr && !altGr && (
            <span className={styles.altgr} aria-hidden="true">
              {key.altgr}
            </span>
          )}
        </button>
      );
    });

  return (
    // The keys sit where the physical keys are, left to right, whatever way the language reads.
    <div
      role="group"
      aria-label={label ?? `${layout.name} on-screen keyboard`}
      lang={layout.id}
      dir="ltr"
      {...withFont(themeProps(theme), font)}
    >
      <div className={styles.keys}>{keysOf(placeKeys(rows))}</div>
      {numpad && (
        <div role="group" aria-label="Number pad" className={styles.numpad}>
          {keysOf(placeKeys(numpadRows(layout.decimal)))}
        </div>
      )}
    </div>
  );
}
