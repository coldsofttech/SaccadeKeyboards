import { describe, expect, it, vi } from 'vitest';
import { describeConformance, key, layout, other } from '../../../../test-support/conformance.js';
import {
  elementAdapter,
  reactComponentAdapter,
  vanillaAdapter,
} from '../../../../test-support/adapters.jsx';
import { LayoutKeyboard } from '../LayoutKeyboard.jsx';
import { defineKeyboardElement } from '../element.js';
import { createKeyboard } from './index.js';

// What every keyboard must do, through each way of using this one.
describeConformance('keyboard', {
  adapters: [
    vanillaAdapter(createKeyboard),
    elementAdapter('saccade-keyboard', defineKeyboardElement),
    reactComponentAdapter(LayoutKeyboard),
  ],
});

/** Layouts with a decimal sign and a tall key, for the number pad and the grid. */
const wide = {
  ...layout,
  id: 'ur-PK',
  name: 'Urdu',
  decimal: '٫',
};

describe('createKeyboard', () => {
  const open = (props = {}) => {
    const host = document.createElement('div');
    document.body.append(host);
    const onKey = vi.fn();
    const keyboard = createKeyboard(host, { layout, onKey, ...props });
    return { host, keyboard, onKey, root: keyboard.element };
  };
  const labels = (root) =>
    [...root.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));

  it("is a group named for its layout, in the layout's language, always left to right", () => {
    const { root, keyboard, host } = open({ layout: wide });
    expect(root).toHaveAttribute('role', 'group');
    expect(root).toHaveAttribute('aria-label', 'Urdu on-screen keyboard');
    expect(root).toHaveAttribute('lang', 'ur-PK');
    expect(root).toHaveAttribute('dir', 'ltr');
    keyboard.update({ label: 'Type here' });
    expect(root).toHaveAttribute('aria-label', 'Type here');
    keyboard.destroy();
    host.remove();
  });

  it('keeps the same buttons while keys are pressed, so the focus stays on a key reached by keyboard', () => {
    const { root, keyboard, host } = open();
    const shift = key(root, 'Shift');
    const buttons = [...root.querySelectorAll('button')];
    shift.focus();
    shift.click();
    expect([...root.querySelectorAll('button')]).toEqual(buttons);
    expect(document.activeElement).toBe(shift);
    expect(shift).toHaveAttribute('aria-pressed', 'true');
    keyboard.destroy();
    host.remove();
  });

  it('gives the focus to the key in the same place when the layer changes', () => {
    const { root, keyboard, host } = open();
    const layerKey = key(root, '?123');
    const place = [...root.querySelectorAll('button')].indexOf(layerKey);
    layerKey.focus();
    layerKey.click();
    const now = [...root.querySelectorAll('button')];
    expect(document.activeElement).toBe(now[Math.min(place, now.length - 1)]);
    expect(root.contains(document.activeElement)).toBe(true);
    keyboard.destroy();
    host.remove();
  });

  it('shows two characters on a key that has a second one, and the AltGr character in the corner', () => {
    const { root, keyboard, host } = open();
    const four = key(root, '4');
    // 4 with $ above it, and € in the corner: the stack and the corner mark are hidden from a screen reader.
    expect(four.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    expect(four).toHaveTextContent('$4€');
    key(root, 'AltGr').click();
    expect(key(root, 'euro')).toHaveTextContent('€');
    expect(key(root, 'euro').querySelector('[aria-hidden="true"]')).toBeNull();
    keyboard.destroy();
    host.remove();
  });

  it('puts every key on the grid at the columns and rows it needs, as wide as its share of the row', () => {
    const { root, keyboard, host } = open();
    const space = key(root, 'Space');
    expect(space.style.gridRow).toBe('2 / span 1');
    expect(space.style.gridColumn).toMatch(/^\d+ \/ span \d+$/);
    const span = (button) => Number(/span (\d+)/.exec(button.style.gridColumn)[1]);
    expect(span(space)).toBeGreaterThan(span(key(root, 'a')));
    keyboard.destroy();
    host.remove();
  });

  it('uses the light theme, the dark theme, or colours of your own', () => {
    const { root, keyboard, host } = open();
    expect(root.className).not.toContain('dark');
    keyboard.update({ theme: 'dark' });
    expect(root.className).toContain('dark');
    keyboard.update({ theme: { accent: 'red', bogus: 'x' } });
    expect(root.className).not.toContain('dark');
    expect(root.style.getPropertyValue('--saccade-accent')).toBe('red');
    expect(root.style.getPropertyValue('--saccade-key')).toBe('');
    keyboard.update({ theme: 'light' });
    expect(root.style.getPropertyValue('--saccade-accent')).toBe('');
    keyboard.destroy();
    host.remove();
  });

  it('sets the font of the keys from a name or a font-family list, and their size', () => {
    const { root, keyboard, host } = open();
    expect(root.style.fontFamily).toContain('system-ui');
    keyboard.update({ font: 'mono' });
    expect(root.style.fontFamily).toContain('monospace');
    keyboard.update({ font: '"Atkinson Hyperlegible", sans-serif' });
    expect(root.style.fontFamily).toContain('Atkinson Hyperlegible');
    keyboard.update({ fontSize: 22 });
    expect(key(root, 'a').style.fontSize).toBe('22px');
    keyboard.destroy();
    host.remove();
  });

  it("adds a number pad that Num Lock turns off, with the layout's decimal sign", () => {
    const { root, keyboard, host, onKey } = open({ layout: wide, numpad: true });
    const pad = root.querySelector('[aria-label="Number pad"]');
    expect(pad).not.toBeNull();
    expect(root.className).toContain('wide');
    expect(pad).toHaveTextContent('٫');
    const seven = [...pad.querySelectorAll('button')].find((b) => b.textContent === '7');
    seven.click();
    expect(onKey).toHaveBeenCalledWith({ type: 'text', value: '7' });
    key(pad, 'Num lock').click();
    expect(seven.disabled).toBe(true);
    seven.click();
    expect(onKey).toHaveBeenCalledTimes(1);
    keyboard.update({ numpad: false });
    expect(root.querySelector('[aria-label="Number pad"]')).toBeNull();
    expect(root.className).not.toContain('wide');
    keyboard.destroy();
    host.remove();
  });

  it('adds a currency key before the space, which shows and hides a row of signs', () => {
    const { root, keyboard, host, onKey } = open({ currencypad: true });
    const currency = key(root, 'Currency symbols');
    expect(currency).not.toBeNull();
    expect(root.querySelector('[aria-label="Currency symbols"][role="group"]')).toBeNull();
    currency.click();
    const row = root.querySelector('[role="group"][aria-label="Currency symbols"]');
    expect(row).not.toBeNull();
    expect(key(root, 'Currency symbols')).toHaveAttribute('aria-pressed', 'true');
    [...row.querySelectorAll('button')].find((b) => b.textContent === '€').click();
    expect(onKey).toHaveBeenCalledWith({ type: 'text', value: '€' });
    key(root, 'Currency symbols').click();
    expect(root.querySelector('[role="group"][aria-label="Currency symbols"]')).toBeNull();
    keyboard.update({ currencypad: false });
    expect(key(root, 'Currency symbols')).toBeNull();
    keyboard.destroy();
    host.remove();
  });

  it('shows a new layout from its first layer, and a layer that goes falls back', () => {
    const { root, keyboard, host } = open();
    key(root, '?123').click();
    keyboard.update({ layout: { ...layout, layers: { letters: layout.layers.letters } } });
    expect(labels(root)).toContain('a');
    keyboard.update({ layout: other });
    expect(labels(root)).toEqual(['z']);
    keyboard.destroy();
    host.remove();
  });

  it('throws a TypeError without a layout', () => {
    expect(() => createKeyboard(document.createElement('div'), { onKey: vi.fn() })).toThrow(
      TypeError,
    );
  });
});
