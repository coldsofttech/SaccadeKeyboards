// The behaviours every keyboard must have, whichever entry point it is reached through. A keyboard's
// tests call `describeConformance` once with an adapter for each entry point it has (see
// adapters.jsx), so the vanilla controller, the Web Component and the React component cannot drift.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import {
  altGrKey,
  capsKey,
  cased,
  shiftKey,
} from '../packages/saccade-keyboards/src/core/layout.js';

const e = { type: 'text', value: 'e', shift: 'E', altgr: 'é' };
const four = { type: 'text', value: '4', shift: '$', altgr: '€' };

/** A small layout with every kind of key the rules need: letters, shift, caps, AltGr, layers. */
export const layout = {
  id: 'en',
  name: 'Test',
  dir: 'ltr',
  layers: {
    letters: [
      [shiftKey, capsKey, altGrKey, ...cased('ab'), e, four],
      [
        { type: 'layer', to: 'symbols', label: '?123' },
        { type: 'space', width: 4 },
        { type: 'close' },
      ],
    ],
    symbols: [
      [
        { type: 'text', value: '1' },
        { type: 'layer', to: 'letters', label: 'abc' },
      ],
    ],
  },
};

/** A second layout, with one layer of its own. */
export const other = {
  id: 'de',
  name: 'Other',
  dir: 'ltr',
  layers: { only: [[{ type: 'text', value: 'z' }]] },
};

/** The button with an accessible name. */
export const key = (root, name) => root.querySelector(`button[aria-label="${name}"]`);

/**
 * @param {string} name The keyboard's name, for the test titles.
 * @param {object} options
 * @param {Array<{ name: string, acceptsShadowRoot?: boolean, mount: Function }>} options.adapters
 * @param {Record<string, unknown>} [options.props] Props the keyboard needs besides `layout` and
 *   the callbacks.
 */
export function describeConformance(name, { adapters, props = {} }) {
  for (const adapter of adapters) {
    describe(`${name} conformance: ${adapter.name}`, () => {
      /** @type {HTMLElement} */
      let host;
      /** @type {Array<{ destroy: () => void }>} */
      let mounted;

      beforeEach(() => {
        host = document.createElement('div');
        document.body.append(host);
        mounted = [];
      });
      afterEach(() => {
        for (const handle of mounted) handle.destroy();
        host.remove();
      });

      const mount = (extra = {}, context = {}) => {
        const onKey = vi.fn();
        const onClose = vi.fn();
        const handle = adapter.mount(
          { layout, onKey, onClose, ...props, ...extra },
          { host, ...context },
        );
        mounted.push(handle);
        return { handle, onKey: extra.onKey ?? onKey, onClose: extra.onClose ?? onClose };
      };
      const press = (handle, label) => key(handle.root, label).click();

      it('shows a key for each key of the first layer, named for a screen reader', () => {
        const { handle } = mount();
        for (const label of [
          'Shift',
          'Caps lock',
          'AltGr',
          'a',
          'b',
          'e',
          '4',
          '?123',
          'Space',
          'Hide keyboard',
        ]) {
          expect(key(handle.root, label), label).not.toBeNull();
        }
        expect(key(handle.root, '1')).toBeNull();
      });

      it('calls onKey with what a key types, and a space types a space', () => {
        const { handle, onKey } = mount();
        press(handle, 'a');
        press(handle, 'Space');
        expect(onKey.mock.calls).toEqual([
          [{ type: 'text', value: 'a' }],
          [{ type: 'text', value: ' ' }],
        ]);
      });

      it('applies shift to the next key only, and shows that it is on', () => {
        const { handle, onKey } = mount();
        press(handle, 'Shift');
        expect(key(handle.root, 'Shift')).toHaveAttribute('aria-pressed', 'true');
        press(handle, 'A');
        press(handle, 'a');
        expect(onKey.mock.calls.map(([k]) => k.value)).toEqual(['A', 'a']);
        expect(key(handle.root, 'Shift')).toHaveAttribute('aria-pressed', 'false');
      });

      it('keeps capitals on with caps lock until it is pressed again', () => {
        const { handle, onKey } = mount();
        press(handle, 'Caps lock');
        press(handle, 'A');
        press(handle, 'A');
        expect(key(handle.root, 'Caps lock')).toHaveAttribute('aria-pressed', 'true');
        press(handle, 'Caps lock');
        press(handle, 'a');
        expect(onKey.mock.calls.map(([k]) => k.value)).toEqual(['A', 'A', 'a']);
      });

      it('types the AltGr character of the next key only', () => {
        const { handle, onKey } = mount();
        press(handle, 'AltGr');
        // A screen reader says the euro sign by name.
        press(handle, 'euro');
        press(handle, '4');
        expect(onKey.mock.calls.map(([k]) => k.value)).toEqual(['€', '4']);
      });

      it('changes layer with a layer key, and back', () => {
        const { handle } = mount();
        press(handle, '?123');
        expect(key(handle.root, '1')).not.toBeNull();
        expect(key(handle.root, 'a')).toBeNull();
        press(handle, 'abc');
        expect(key(handle.root, 'a')).not.toBeNull();
      });

      it('calls onClose for the hide key', () => {
        const { handle, onClose } = mount();
        press(handle, 'Hide keyboard');
        expect(onClose).toHaveBeenCalledTimes(1);
      });

      it('shows the keys of a new layout, from its first layer', () => {
        const { handle } = mount();
        press(handle, '?123');
        handle.update({ layout: other });
        expect(key(handle.root, 'z')).not.toBeNull();
        expect(key(handle.root, '1')).toBeNull();
      });

      it('uses a replaced callback without losing the state of the keyboard', () => {
        const { handle, onKey } = mount();
        press(handle, 'Shift');
        const next = vi.fn();
        handle.update({ onKey: next });
        press(handle, 'A');
        expect(onKey).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith({ type: 'text', value: 'A' });
      });

      it('keeps the focus where it was: a press on a key is not allowed to move it', () => {
        const { handle } = mount();
        const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        key(handle.root, 'a').dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
      });

      it('removes its DOM on destroy and survives destroy twice and update after destroy', () => {
        const { handle } = mount();
        handle.destroy();
        expect(host.childNodes.length).toBe(0);
        expect(() => handle.destroy()).not.toThrow();
        expect(() => handle.update({ layout: other })).not.toThrow();
      });

      it('leaves its container siblings alone', () => {
        const sibling = document.createElement('p');
        sibling.textContent = 'mine';
        host.append(sibling);
        const { handle } = mount();
        handle.destroy();
        expect(host.contains(sibling)).toBe(true);
        expect(sibling.textContent).toBe('mine');
      });

      it('has no accessibility violations', async () => {
        mount();
        expect(await axe(host)).toHaveNoViolations();
      });

      if (adapter.acceptsShadowRoot) {
        it('draws inside a shadow root when given one as the container', () => {
          const shadow = host.attachShadow({ mode: 'open' });
          const { handle } = mount({}, { container: shadow });
          expect(handle.root.getRootNode()).toBe(shadow);
          expect(host.childNodes.length).toBe(0);
          handle.destroy();
          expect(shadow.childNodes.length).toBe(0);
        });
      }
    });
  }
}
