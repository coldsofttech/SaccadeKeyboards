/* eslint-disable security/detect-object-injection -- every key is a prop, attribute or event name from the keyboard's own element spec, never text from a file. */
/**
 * @typedef {'string' | 'number' | 'boolean'} AttributeType
 *
 * @typedef {object} EventSpec
 * @property {string} name The event name, for example `saccade-key`.
 * @property {boolean} [cancelable] Whether `preventDefault()` on the event is meaningful.
 * @property {(...args: any[]) => unknown} [detail] Builds the event's `detail` from the callback's
 *   arguments. Defaults to the first argument.
 * @property {(host: HTMLElement, ...args: any[]) => void} [fallback] Runs after the event when it was
 *   cancelable and nobody called `preventDefault()`; it is given the element and the callback's
 *   arguments. This is the behaviour a keyboard has when no callback is given.
 *
 * @typedef {object} KeyboardElementSpec
 * @property {string} tag The default tag name, for example `saccade-keyboard`.
 * @property {(container: ShadowRoot, props: any) => import('../vanilla/shell.js').KeyboardController} create
 *   The keyboard's `/vanilla` factory.
 * @property {string} [css] The keyboard's CSS text, adopted into the shadow root.
 * @property {Record<string, string | [string, AttributeType]>} [attributes] Attributes, by name,
 *   with the prop each sets: `{ src: 'source', 'allow-images': ['allowImages', 'boolean'] }`. Each
 *   prop also becomes a property of the element.
 * @property {string[]} [properties] Props that are properties only (objects, functions, binary
 *   sources): `['fetcher', 'target']`.
 * @property {(props: Record<string, any>) => boolean} [ready] Whether the props are enough to create the
 *   keyboard (a `layout`, or a `language`). Until then the element waits. Defaults to always.
 * @property {Record<string, string | EventSpec>} [events] Callback props, by name, and the event
 *   each one becomes.
 */

// Keys for the element's own accessors, so the properties defined from outside the class can reach
// its private state without adding to the element's public API.
const GET = Symbol('get');
const SET = Symbol('set');

/**
 * Turns an attribute's text into the prop's value. A missing attribute is `undefined`, so the
 * keyboard's own default applies. A boolean attribute is `true` when present, except that the text
 * `false` makes it `false` (so a prop that is on by default can be turned off in markup).
 *
 * @param {string | null} value
 * @param {AttributeType} type
 */
function fromAttribute(value, type) {
  if (type === 'boolean') return value === null ? undefined : value !== 'false';
  if (value === null) return undefined;
  return type === 'number' ? Number(value) : value;
}

/**
 * Makes the function that registers a keyboard's Web Component. The element:
 *
 * - draws into an open shadow root, with the keyboard's CSS adopted into it, so the page's styles
 *   do not reach the keyboard and the keyboard's do not reach the page. `--saccade-*` custom properties
 *   set on the element or an ancestor do reach it;
 * - creates the keyboard when it is connected and has its required props, and destroys it when it is
 *   disconnected;
 * - turns callbacks into bubbling, composed `CustomEvent`s;
 * - keeps props set before the keyboard exists and applies them when it is created.
 *
 * Nothing runs at import: the class is built when the returned function is called, so importing
 * this in a server render is safe. In an environment with no custom elements, it returns `null`.
 *
 * @param {KeyboardElementSpec} spec
 * @returns {(tag?: string) => CustomElementConstructor | null} Registers the element and returns
 *   its class. A tag that is already defined is left alone.
 */
export function defineElement(spec) {
  const { tag: defaultTag, create, css, events = {}, ready = () => true } = spec;
  /** @type {Map<string, [string, AttributeType]>} */
  const attributes = new Map(
    Object.entries(spec.attributes ?? {}).map(([name, target]) => [
      name,
      typeof target === 'string' ? [target, 'string'] : target,
    ]),
  );
  const propNames = [
    ...new Set([...[...attributes.values()].map(([prop]) => prop), ...(spec.properties ?? [])]),
  ];

  return (tag = defaultTag) => {
    if (typeof HTMLElement === 'undefined' || typeof customElements === 'undefined') return null;
    const existing = customElements.get(tag);
    if (existing) return existing;

    /** @type {CSSStyleSheet | null} */
    let sheet = null;
    /** Adopts the CSS where the browser can share one parsed sheet, and otherwise adds a <style>. */
    const addStyles = (/** @type {ShadowRoot} */ shadow) => {
      const text = `:host{display:block}:host([hidden]){display:none}${css ?? ''}`;
      if ('adoptedStyleSheets' in shadow && typeof CSSStyleSheet !== 'undefined') {
        sheet ??= new CSSStyleSheet();
        if (sheet.cssRules.length === 0) sheet.replaceSync(text);
        shadow.adoptedStyleSheets = [sheet];
      } else {
        const style = shadow.ownerDocument.createElement('style');
        style.textContent = text;
        shadow.append(style);
      }
    };

    class SaccadeKeyboardElement extends HTMLElement {
      static observedAttributes = [...attributes.keys()];

      /** @type {Record<string, any>} */
      #props = {};
      /** @type {import('../vanilla/shell.js').KeyboardController | null} */
      #keyboard = null;
      #shadow = this.attachShadow({ mode: 'open' });

      constructor() {
        super();
        addStyles(this.#shadow);
        for (const [callback, eventSpec] of Object.entries(events)) {
          const {
            name,
            cancelable = false,
            detail,
            fallback,
          } = typeof eventSpec === 'string' ? { name: eventSpec } : eventSpec;
          this.#props[callback] = (/** @type {any[]} */ ...args) => {
            const event = new CustomEvent(name, {
              detail: detail ? detail(...args) : args[0],
              bubbles: true,
              composed: true,
              cancelable,
            });
            const proceed = this.dispatchEvent(event);
            if (proceed && cancelable) fallback?.(this, ...args);
          };
        }
      }

      connectedCallback() {
        this.#sync();
      }

      disconnectedCallback() {
        this.#keyboard?.destroy();
        this.#keyboard = null;
      }

      /**
       * @param {string} name
       * @param {string | null} _old
       * @param {string | null} value
       */
      attributeChangedCallback(name, _old, value) {
        const [prop, type] = /** @type {[string, AttributeType]} */ (attributes.get(name));
        this.#set(prop, fromAttribute(value, type));
      }

      /** @param {string} prop */
      [GET](prop) {
        return this.#props[prop];
      }

      /**
       * @param {string} prop
       * @param {unknown} value
       */
      [SET](prop, value) {
        this.#set(prop, value);
      }

      /**
       * @param {string} prop
       * @param {unknown} value
       */
      #set(prop, value) {
        this.#props[prop] = value;
        if (this.#keyboard) this.#keyboard.update({ [prop]: value });
        else this.#sync();
      }

      /** Creates the keyboard once the element is connected and has what it needs. */
      #sync() {
        if (this.#keyboard || !this.isConnected) return;
        if (!ready(this.#props)) return;
        this.#keyboard = create(this.#shadow, { ...this.#props });
      }
    }

    for (const prop of propNames) {
      Object.defineProperty(SaccadeKeyboardElement.prototype, prop, {
        configurable: true,
        enumerable: true,
        get() {
          return this[GET](prop);
        },
        set(value) {
          this[SET](prop, value);
        },
      });
    }

    customElements.define(tag, SaccadeKeyboardElement);
    return SaccadeKeyboardElement;
  };
}
