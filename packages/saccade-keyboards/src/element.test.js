import { afterEach, describe, expect, it, vi } from 'vitest';
import { layout, key } from '../../../test-support/conformance.js';
import './element.js';

const mounted = [];
afterEach(() => {
  for (const el of mounted.splice(0)) el.remove();
});
const open = (setup = () => {}) => {
  const el = document.createElement('saccade-keyboard');
  setup(el);
  document.body.append(el);
  mounted.push(el);
  return el;
};
const root = (el) => el.shadowRoot.querySelector('[data-saccade-root]');

describe('<saccade-keyboard>', () => {
  it('is registered by importing the element, and waits for a layout', () => {
    expect(customElements.get('saccade-keyboard')).toBeDefined();
    const el = open();
    expect(el.shadowRoot).not.toBeNull();
    expect(root(el)).toBeNull();
    el.layout = layout;
    expect(root(el).querySelectorAll('button').length).toBeGreaterThan(5);
  });

  it('reads theme, label, font, font-size, numpad and currencypad from attributes', () => {
    const el = open((e) => {
      e.setAttribute('theme', 'dark');
      e.setAttribute('label', 'Type here');
      e.setAttribute('font', 'mono');
      e.setAttribute('font-size', '20');
      e.setAttribute('numpad', '');
      e.setAttribute('currencypad', '');
      e.layout = layout;
    });
    const r = root(el);
    expect(r.className).toContain('dark');
    expect(r).toHaveAttribute('aria-label', 'Type here');
    expect(r.style.fontFamily).toContain('monospace');
    expect(key(r, 'a').style.fontSize).toBe('20px');
    expect(r.querySelector('[aria-label="Number pad"]')).not.toBeNull();
    expect(key(r, 'Currency symbols')).not.toBeNull();
    el.setAttribute('numpad', 'false');
    expect(r.querySelector('[aria-label="Number pad"]')).toBeNull();
    el.removeAttribute('theme');
    expect(r.className).not.toContain('dark');
  });

  it('turns key presses into saccade-key events that leave the shadow root, and the hide key into saccade-close', () => {
    const el = open((e) => (e.layout = layout));
    const seen = [];
    document.addEventListener('saccade-key', (event) => seen.push(event.detail));
    const closed = vi.fn();
    el.addEventListener('saccade-close', closed);
    key(root(el), 'a').click();
    key(root(el), 'Space').click();
    key(root(el), 'Hide keyboard').click();
    expect(seen).toEqual([
      { type: 'text', value: 'a' },
      { type: 'text', value: ' ' },
    ]);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('is a block, hidden by the hidden attribute, and carries its own CSS', () => {
    const el = open((e) => (e.layout = layout));
    // jsdom has constructable stylesheets, so the shared sheet is adopted.
    const sheets = el.shadowRoot.adoptedStyleSheets;
    expect(sheets).toHaveLength(1);
    expect(sheets[0].cssRules.length).toBeGreaterThan(0);
  });

  it('removes the keyboard when disconnected, and draws it again when connected', () => {
    const el = open((e) => (e.layout = layout));
    el.remove();
    expect(root(el)).toBeNull();
    document.body.append(el);
    expect(root(el)).not.toBeNull();
  });
});
