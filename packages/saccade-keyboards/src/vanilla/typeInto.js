import { applyKey } from '../core/applyKey.js';

/** @typedef {import('../core/applyKey.js').KeyPress} KeyPress */

/** What an `input` event says happened, by the kind of key. */
const INPUT_TYPES = {
  text: 'insertText',
  backspace: 'deleteContentBackward',
  enter: 'insertLineBreak',
};

/**
 * Finds the field a keyboard types into. A selector is looked up from the keyboard's own root and
 * then outward, past each shadow root, so `for="#field"` finds a field in the page from a
 * keyboard inside its own shadow root. An element is used as it is.
 *
 * @param {HTMLElement | string | null | undefined} spec An element or a selector.
 * @param {Node} from A node of the keyboard.
 * @returns {HTMLElement | null} The field, or `null` if there is none.
 */
export function resolveField(spec, from) {
  if (!spec) return null;
  if (typeof spec !== 'string') return spec;
  /** @type {Node | null} */
  let scope = from.getRootNode();
  while (scope) {
    try {
      const found = /** @type {ParentNode} */ (scope).querySelector?.(spec);
      if (found) return /** @type {HTMLElement} */ (found);
    } catch {
      return null; // not a valid selector
    }
    scope = /** @type {ShadowRoot} */ (scope).host?.getRootNode() ?? null;
  }
  return null;
}

/**
 * Types a key into an input or textarea at its caret, the way a real key would: the selection is
 * replaced, the caret moves, and a bubbling `input` event tells listeners and frameworks. The value
 * is set through the element's own setter, so a field a framework controls sees it.
 *
 * Nothing happens (and `false` is returned) for a field that is disabled or read only, for Enter in a
 * single-line input, for a key that would pass `maxlength`, or when the key changes nothing.
 *
 * @param {HTMLElement} field The input or textarea.
 * @param {KeyPress} key The key that was pressed.
 * @returns {boolean} Whether the field changed.
 */
export function typeInto(field, key) {
  const tag = field.localName;
  if (tag !== 'input' && tag !== 'textarea') return false;
  const input = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (field);
  if (input.disabled || input.readOnly) return false;
  if (key.type === 'enter' && tag === 'input') return false;

  const text = input.value;
  // Some types (number, email) have no selection: the caret is taken to be at the end.
  const start = input.selectionStart ?? text.length;
  const end = input.selectionEnd ?? text.length;
  const next = applyKey(text, { start, end }, key);
  if (next.text === text) return false;
  if (
    input.maxLength >= 0 &&
    next.text.length > input.maxLength &&
    next.text.length > text.length
  ) {
    return false;
  }

  const view = field.ownerDocument.defaultView;
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set;
  if (setter) setter.call(input, next.text);
  else input.value = next.text;
  try {
    input.setSelectionRange(next.selection.start, next.selection.end);
  } catch {
    // The type has no selection to set.
  }
  const type = INPUT_TYPES[key.type];
  const event = view?.InputEvent
    ? new view.InputEvent('input', {
        bubbles: true,
        composed: true,
        inputType: type,
        data: key.type === 'text' ? (key.value ?? null) : null,
      })
    : new Event('input', { bubbles: true, composed: true });
  input.dispatchEvent(event);
  return true;
}
