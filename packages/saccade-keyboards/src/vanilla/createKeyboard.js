import { placeKeys } from '../core/grid.js';
import { keys as keysFor, numpadRows } from '../core/layout.js';
import { createKeyboardModel } from '../core/model.js';
import { loadLayout } from '../core/registry.js';
import { CURRENCY_SIGNS } from '../core/typed.js';
import styles from '../Keyboard.module.css';
import { createShell } from './shell.js';
import { resolveField, typeInto } from './typeInto.js';

/** @typedef {import('../core/layout.js').Layout} Layout */
/** @typedef {import('../core/layout.js').Key} Key */
/** @typedef {import('../core/applyKey.js').KeyPress} KeyPress */
/** @typedef {import('../core/grid.js').PlacedKey} PlacedKey */
/** @typedef {import('./shell.js').KeyboardController} KeyboardController */

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
 * @property {Layout} [layout] The layout; the first layer is shown first. It wins over `language`.
 * @property {string} [language] A registered language code, such as `en`. The layout is loaded the
 *   first time it is needed; a code with no package says which one to install.
 * @property {HTMLElement | string} [field] An input or textarea (or a selector for one, looked up from
 *   the keyboard outward) that each key is typed into at its caret, with an `input` event. `onKey`
 *   is still called. Without it the keyboard types nothing.
 * @property {string | Node} [fallback] Shown while a language loads: text, or an element.
 * @property {(layout: Layout) => void} [onReady] A language has loaded and the keyboard is shown.
 * @property {(key: KeyPress) => void} onKey A key was pressed (the space key types a space).
 * @property {() => void} [onClose] The hide key was pressed.
 * @property {(error: Error) => void} [onError] A language could not be loaded.
 * @property {'light' | 'dark' | ThemeColors} [theme] Colours of the keyboard ('light').
 * @property {string} [label] The name of the keyboard for a screen reader.
 * @property {string} [font] The font of the keys: `native` (the device's own font), `sans`, `serif`,
 *   `mono`, or any CSS font-family list, such as `"Atkinson Hyperlegible", sans-serif` ('native').
 * @property {boolean} [numpad] Show a number pad beside the keys (false). Its decimal key types the
 *   `decimal` of the layout.
 * @property {boolean} [currencypad] Add a currency key before the space key (false). It shows or
 *   hides a row of currency signs above the keys.
 * @property {number} [fontSize] The size of the letters on the keys, in pixels (16).
 */

/** The lighter character of a two-character key; a narrow keyboard hides it until it is typed. */
const hint = `${styles.secondary} ${styles.hint} ${styles.ghost}`;

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

/**
 * Whether a key has a second character of its own, like the ! above the 1, rather than just the
 * capital of a letter.
 *
 * @param {Key} key
 * @returns {key is import('../core/layout.js').TextKey}
 */
const hasSecondCharacter = (key) =>
  key.type === 'text' && key.shift !== undefined && key.shift !== key.value.toUpperCase();

/**
 * The rows with a currency key before each space key, which gives up the same width so the row
 * keeps its length.
 *
 * @param {Key[][]} rows
 * @returns {Key[][]}
 */
const withCurrencyKey = (rows) =>
  rows.map((row) =>
    row.flatMap((key) =>
      key.type === 'space'
        ? [
            /** @type {Key} */ ({ type: 'currency', width: 1 }),
            { ...key, width: (key.width ?? 1) - 1 },
          ]
        : [key],
    ),
  );

/**
 * An on-screen keyboard for a layout, drawn into a container. It edits nothing: it says which key
 * was pressed, and whoever uses it types into its own field (see `applyKey`). Pressing a key keeps
 * the focus where it was.
 *
 * The keys stay in the page while the reader types, so a key the reader reached with the keyboard
 * keeps the focus; only what is on a key is drawn again. The keys are drawn again when the layer, the
 * number pad or the currency row changes, and the focus goes to the key in the same place.
 *
 * @param {HTMLElement | ShadowRoot} container
 * @param {KeyboardProps} props
 * @returns {KeyboardController}
 */
export function createKeyboard(container, props) {
  if (!props || (!props.layout && !props.language)) {
    throw new TypeError('The "layout" or the "language" prop is required.');
  }
  const shell = createShell(container, props);
  const { root, h } = shell;

  /**
   * A character that is only there to be seen, such as the symbol above a number. The stylesheet
   * draws it from `data-char`, so it is not text in the page: a screen reader, and the check that a
   * name contains the visible text (WCAG 2.5.3), see only the character the key types.
   *
   * @param {string} char
   * @param {string} className
   * @param {boolean} [hidden] Hide it from a screen reader too (outside the stack, which is hidden).
   */
  const ghost = (char, className, hidden = false) =>
    h('span', { class: className, 'data-char': char, ...(hidden && { 'aria-hidden': 'true' }) });
  /** @type {ReturnType<typeof createKeyboardModel> | null} */
  let model = null;
  /** What the keyboard shows: a status while a language loads or fails, or the keys. */
  let phase = /** @type {'loading' | 'error' | 'ready'} */ ('loading');
  /** @type {Error | null} */
  let failure = null;
  // The keys sit where the physical keys are, left to right, whatever way the language reads.
  root.setAttribute('dir', 'ltr');

  /** @type {Array<{ key: Key, element: HTMLButtonElement }>} */
  let entries = [];
  /** @type {{ rows: Key[][], currencyRow: boolean, currencypad: boolean, numpad: boolean, decimal: string | undefined } | null} */
  let structure = null;

  const keyboardProps = () => /** @type {KeyboardProps} */ (shell.props);
  const keyboardModel = () => /** @type {ReturnType<typeof createKeyboardModel>} */ (model);

  /** The classes, colours and font of the keyboard. */
  function appearance() {
    const { theme = 'light', font = 'native', numpad = false } = keyboardProps();
    const custom = theme !== null && typeof theme === 'object';
    const classes = [styles.root];
    if (theme === 'dark') classes.push(styles.dark);
    if (numpad) classes.push(styles.wide);
    root.className = classes.join(' ');
    for (const token of TOKENS.values()) root.style.removeProperty(token);
    if (custom) {
      for (const [name, value] of Object.entries(theme)) {
        const token = TOKENS.get(name);
        if (token) root.style.setProperty(token, String(value));
      }
    }
    root.style.fontFamily = FONTS.get(font) ?? font;
  }

  /**
   * What is on a key: its characters, which change with shift and AltGr.
   *
   * @param {{ key: Key, element: HTMLButtonElement }} entry
   */
  function paint({ key, element }) {
    const { fontSize = 16 } = keyboardProps();
    const { shift, altGr } = keyboardModel().getState();
    const { label: text, caption, name, pressed, disabled } = keyboardModel().describe(key);
    element.setAttribute('aria-label', name);
    if (pressed === undefined) element.removeAttribute('aria-pressed');
    else element.setAttribute('aria-pressed', String(pressed));
    element.disabled = Boolean(disabled);
    element.className = pressed ? `${styles.key} ${styles.active}` : styles.key;
    element.style.fontSize = `${fontSize}px`;

    /** @type {Array<string | Node>} */
    const content = [];
    if (caption) {
      content.push(
        h(
          'span',
          { class: styles.stack, 'aria-hidden': 'true' },
          h('span', null, text),
          h('span', { class: styles.secondary }, caption),
        ),
      );
    } else if (altGr && key.type === 'text' && key.altgr) {
      content.push(text);
    } else if (hasSecondCharacter(key)) {
      content.push(
        h(
          'span',
          { class: styles.stack, 'aria-hidden': 'true' },
          shift === 'once' ? h('span', null, key.shift) : ghost(key.shift ?? '', hint),
          shift === 'once' ? ghost(key.value, hint) : h('span', null, key.value),
        ),
      );
    } else {
      content.push(text);
    }
    if (key.type === 'text' && key.altgr && !altGr) {
      content.push(ghost(key.altgr, `${styles.altgr} ${styles.ghost}`, true));
    }
    element.replaceChildren(...content);
  }

  /** @param {PlacedKey[][]} placed */
  function buttonsOf(placed) {
    return placed.flat().map(({ key, column, columnSpan, row, rowSpan }) => {
      const element = /** @type {HTMLButtonElement} */ (
        h('button', {
          type: 'button',
          // Keep the focus (and the caret) in the field being typed into.
          onmousedown: (/** @type {Event} */ event) => event.preventDefault(),
          onclick: () => keyboardModel().press(key),
        })
      );
      element.style.gridColumn = `${column} / span ${columnSpan}`;
      element.style.gridRow = `${row} / span ${rowSpan}`;
      const entry = { key, element };
      entries.push(entry);
      return element;
    });
  }

  /** Makes the keys, when what they are made from has changed. */
  function build() {
    const { rows, currencyOpen } = keyboardModel().getState();
    const { currencypad = false, numpad = false } = keyboardProps();
    const wanted = {
      rows,
      currencyRow: currencypad && currencyOpen,
      currencypad,
      numpad,
      decimal: keyboardModel().layout.decimal,
    };
    if (
      structure &&
      Object.keys(wanted).every((name) =>
        Object.is(
          structure?.[/** @type {keyof typeof wanted} */ (name)],
          wanted[/** @type {keyof typeof wanted} */ (name)],
        ),
      )
    ) {
      return;
    }
    structure = wanted;

    // The key that has the focus, if it is one of ours, so it can be given back to its place.
    const active = /** @type {ShadowRoot | Document} */ (root.getRootNode()).activeElement;
    const focused = entries.findIndex((entry) => entry.element === active);
    entries = [];

    const main = h('div', { class: styles.main });
    if (wanted.currencyRow) {
      main.append(
        h(
          'div',
          { role: 'group', 'aria-label': 'Currency symbols', class: styles.keys },
          buttonsOf(placeKeys([keysFor(CURRENCY_SIGNS)])),
        ),
      );
    }
    main.append(
      h(
        'div',
        { class: styles.keys },
        buttonsOf(placeKeys(currencypad ? withCurrencyKey(rows) : rows)),
      ),
    );
    const parts = [main];
    if (numpad) {
      parts.push(
        h(
          'div',
          { role: 'group', 'aria-label': 'Number pad', class: styles.numpad },
          buttonsOf(placeKeys(numpadRows(keyboardModel().layout.decimal))),
        ),
      );
    }
    root.replaceChildren(...parts);
    if (focused >= 0) entries.at(Math.min(focused, entries.length - 1))?.element.focus();
  }

  /** Draws the keys, or the status shown while there are none. */
  function render() {
    if (phase !== 'ready' || !model) {
      entries = [];
      structure = null;
      root.removeAttribute('role');
      root.removeAttribute('aria-label');
      root.removeAttribute('lang');
      root.className = styles.root;
      if (phase === 'error') {
        root.replaceChildren(h('p', { role: 'alert' }, failure?.message ?? ''));
      } else {
        const { fallback } = keyboardProps();
        root.replaceChildren(...(fallback === undefined ? [] : [fallback]));
      }
      return;
    }
    const { label } = keyboardProps();
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', label ?? `${model.layout.name} on-screen keyboard`);
    root.setAttribute('lang', model.layout.id);
    appearance();
    build();
    for (const entry of entries) paint(entry);
  }

  /** @param {Layout} layout */
  function show(layout) {
    phase = 'ready';
    if (model) model.setLayout(layout);
    else {
      model = createKeyboardModel({
        layout,
        onKey: (key) => {
          const field = resolveField(keyboardProps().field, root);
          if (field) typeInto(field, key);
          shell.emit('onKey', key);
        },
        onClose: () => shell.emit('onClose'),
      });
      shell.cleanup(model.subscribe(render));
    }
    render();
  }

  /** Shows the layout given, or loads the language; the latest request wins. */
  function resolve() {
    const { layout, language } = keyboardProps();
    if (layout) {
      shell.cancel();
      show(layout);
      return;
    }
    if (!language) {
      shell.cancel();
      failure = new TypeError('The "layout" or the "language" prop is required.');
      phase = 'error';
      render();
      return;
    }
    phase = 'loading';
    render();
    shell.load(() => loadLayout(language), {
      onResult(loaded) {
        show(loaded);
        shell.emit('onReady', loaded);
      },
      onError(error) {
        failure = error;
        phase = 'error';
        render();
        shell.emit('onError', error);
      },
    });
  }

  shell.onUpdate((changed) => {
    if (changed.includes('layout') || changed.includes('language')) resolve();
    else render();
  });
  resolve();
  return shell.api;
}
