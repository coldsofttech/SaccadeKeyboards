import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { layout, other } from '../../../../test-support/conformance.js';
import {
  elementAdapter,
  reactComponentAdapter,
  vanillaAdapter,
} from '../../../../test-support/adapters.jsx';
import { Keyboard } from '../Keyboard.jsx';
import { registerLanguage } from '../core/registry.js';
import { defineKeyboardElement } from '../element.js';
import { createKeyboard } from './index.js';

const adapters = [
  vanillaAdapter(createKeyboard),
  elementAdapter('saccade-keyboard', defineKeyboardElement),
  reactComponentAdapter(Keyboard),
];

registerLanguage('lang-a', async () => ({ layout }));
registerLanguage('lang-b', async () => other);
registerLanguage('lang-never', () => new Promise(() => {}));
registerLanguage('lang-bad', async () => ({ layout: { id: 'bad' } }));

/** What a reader sees: the keyboard's root, or whatever stands in for it while there is none. */
const seen = (mounted, host) => {
  const root = mounted.root;
  if (root) return root;
  // The element keeps its content in a shadow root.
  const element = host.firstElementChild;
  return element?.shadowRoot ?? element ?? host;
};

for (const adapter of adapters) {
  describe(`language support: ${adapter.name}`, () => {
    const open = (props) => {
      const host = document.createElement('div');
      document.body.append(host);
      const mounted = adapter.mount({ onKey: vi.fn(), ...props }, { host });
      return {
        host,
        mounted,
        content: () => seen(mounted, host),
        done: () => {
          mounted.destroy();
          host.remove();
        },
      };
    };

    it('loads the layout of a registered language and says when it is ready', async () => {
      const onReady = vi.fn();
      const t = open({ language: 'lang-a', onReady });
      await waitFor(() => expect(t.content().querySelector('button')).not.toBeNull());
      expect(onReady).toHaveBeenCalledTimes(1);
      expect(onReady.mock.calls[0][0].id).toBe(layout.id);
      expect(t.content().getAttribute('lang')).toBe(layout.id);
      t.done();
    });

    it('shows the fallback while it loads', async () => {
      const t = open({ language: 'lang-never', fallback: 'Loading keys' });
      await Promise.resolve();
      expect(t.content().textContent).toContain('Loading keys');
      expect(t.content().querySelector('button')).toBeNull();
      t.done();
    });

    it('says which package to install for a language nobody registered, and tells onError', async () => {
      const onError = vi.fn();
      const t = open({ language: 'lang-missing', onError });
      await waitFor(() => expect(t.content().querySelector('[role="alert"]')).not.toBeNull());
      expect(t.content().querySelector('[role="alert"]').textContent).toMatch(
        /@coldsofttech\/saccade-lang-missing/,
      );
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
      t.done();
    });

    it('reports a layout that is not valid', async () => {
      const onError = vi.fn();
      const t = open({ language: 'lang-bad', onError });
      await waitFor(() => expect(onError).toHaveBeenCalled());
      expect(t.content().querySelector('[role="alert"]').textContent).toMatch(/not a valid layout/);
      t.done();
    });

    it('switches to a new language, and a newer language wins over a slower older one', async () => {
      let release;
      registerLanguage('lang-slow', () => new Promise((ok) => (release = () => ok(layout))));
      const t = open({ language: 'lang-slow' });
      await Promise.resolve();
      t.mounted.update({ language: 'lang-b' });
      await waitFor(() => expect(t.content().querySelector('button')).not.toBeNull());
      release();
      await new Promise((ok) => setTimeout(ok, 20));
      const names = [...t.content().querySelectorAll('button')].map((b) =>
        b.getAttribute('aria-label'),
      );
      expect(names).toContain('z');
      expect(names).not.toContain('a');
      t.done();
    });

    it('uses `layout` over `language`', async () => {
      const t = open({ language: 'lang-never', layout });
      await waitFor(() => expect(t.content().querySelector('button')).not.toBeNull());
      t.done();
    });

    it('does not call onReady after it is removed', async () => {
      let release;
      registerLanguage('lang-late', () => new Promise((ok) => (release = () => ok(layout))));
      const onReady = vi.fn();
      const t = open({ language: 'lang-late', onReady });
      await Promise.resolve();
      t.done();
      release();
      await new Promise((ok) => setTimeout(ok, 20));
      expect(onReady).not.toHaveBeenCalled();
    });
  });
}

describe('createKeyboard without a layout', () => {
  it('needs a layout or a language', () => {
    const host = document.createElement('div');
    expect(() => createKeyboard(host, { onKey() {} })).toThrow(/layout.*language/);
  });
});
