import { describe, expect, it, vi } from 'vitest';
import { createKeyboardModel } from './model.js';
import { altGrKey, bottomRow, capsKey, cased, shiftKey } from './layout.js';

const e = { type: 'text', value: 'e', shift: 'E', altgr: 'é' };
const four = { type: 'text', value: '4', shift: '$', altgr: '€' };
const pad = { type: 'text', value: '7', numpad: true };
const layout = {
  id: 'xx',
  name: 'Test',
  dir: 'ltr',
  names: { '€': 'euro' },
  layers: {
    letters: [
      [shiftKey, capsKey, altGrKey, ...cased('ab'), e, four, pad],
      bottomRow({ type: 'layer', to: 'symbols', label: '?123' }),
    ],
    symbols: [[{ type: 'text', value: '1' }]],
  },
};
const [shift, caps, altgr, a] = layout.layers.letters[0];
const numlock = { type: 'numlock' };
const currency = { type: 'currency' };

/** A model that records the keys it is asked to type. */
function open(extra = {}) {
  const onKey = vi.fn();
  const onClose = vi.fn();
  const model = createKeyboardModel({ layout, onKey, onClose, ...extra });
  return { model, onKey, onClose };
}

describe('createKeyboardModel', () => {
  it('starts on the first layer, with everything off but Num Lock', () => {
    const { model } = open();
    const state = model.getState();
    expect(state).toMatchObject({
      layer: 'letters',
      shift: 'off',
      altGr: false,
      numLock: true,
      currencyOpen: false,
    });
    expect(state.rows).toBe(layout.layers.letters);
  });

  it('turns shift off after one key, and keeps it on with caps', () => {
    const { model, onKey } = open();
    model.press(shift);
    expect(model.getState().shift).toBe('once');
    model.press(a);
    model.press(a);
    expect(onKey.mock.calls).toEqual([
      [{ type: 'text', value: 'A' }],
      [{ type: 'text', value: 'a' }],
    ]);
    model.press(caps);
    expect(model.getState().shift).toBe('caps');
    model.press(a);
    model.press(a);
    expect(onKey).toHaveBeenLastCalledWith({ type: 'text', value: 'A' });
    // Caps lock capitalises letters only: a digit keeps its character.
    model.press(four);
    expect(onKey).toHaveBeenLastCalledWith({ type: 'text', value: '4' });
  });

  it('toggles shift and caps off again', () => {
    const { model } = open();
    model.press(caps);
    model.press(caps);
    expect(model.getState().shift).toBe('off');
    // The shift key also unlocks caps lock, and is then off.
    model.press(caps);
    model.press(shift);
    expect(model.getState().shift).toBe('off');
    model.press(shift);
    expect(model.getState().shift).toBe('once');
    model.press(shift);
    expect(model.getState().shift).toBe('off');
  });

  it('types the AltGr character of the next key only, capitalised with shift', () => {
    const { model, onKey } = open();
    model.press(altgr);
    expect(model.getState().altGr).toBe(true);
    model.press(four);
    model.press(four);
    model.press(altgr);
    model.press(shift);
    model.press(e);
    expect(onKey.mock.calls.map(([key]) => key.value)).toEqual(['€', '4', 'É']);
    model.press(altgr);
    model.press(altgr);
    expect(model.getState().altGr).toBe(false);
  });

  it('types a space and the plain keys, and shift applies to a space', () => {
    const { model, onKey } = open();
    model.press(shift);
    model.press({ type: 'space' });
    expect(model.getState().shift).toBe('off');
    model.press({ type: 'backspace' });
    model.press({ type: 'enter' });
    expect(onKey.mock.calls.map(([key]) => key)).toEqual([
      { type: 'text', value: ' ' },
      { type: 'backspace' },
      { type: 'enter' },
    ]);
  });

  it('changes layer, clears shift and AltGr, and falls back when the layer goes', () => {
    const { model } = open();
    model.press(shift);
    model.press(altgr);
    model.press({ type: 'layer', to: 'symbols', label: '?123' });
    expect(model.getState()).toMatchObject({ layer: 'symbols', shift: 'off', altGr: false });
    model.setLayout({ ...layout, layers: { letters: layout.layers.letters } });
    expect(model.getState().layer).toBe('letters');
  });

  it('ignores the number pad while Num Lock is off, and says so in describe', () => {
    const { model, onKey } = open();
    model.press(numlock);
    expect(model.getState().numLock).toBe(false);
    model.press(pad);
    expect(onKey).not.toHaveBeenCalled();
    expect(model.describe(pad)).toMatchObject({ label: '7', disabled: true });
    model.press(numlock);
    model.press(pad);
    expect(onKey).toHaveBeenCalledWith({ type: 'text', value: '7' });
    expect(model.describe(pad).disabled).toBe(false);
  });

  it('opens and closes the currency row, and calls onClose for the hide key', () => {
    const { model, onClose } = open();
    model.press(currency);
    expect(model.getState().currencyOpen).toBe(true);
    expect(model.describe(currency)).toMatchObject({ pressed: true, name: 'Currency symbols' });
    model.press(currency);
    expect(model.getState().currencyOpen).toBe(false);
    model.press({ type: 'close' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('describes keys for drawing and for a screen reader', () => {
    const { model } = open();
    expect(model.describe(a)).toEqual({ label: 'a', name: 'a' });
    expect(model.describe(four)).toEqual({ label: '4', name: '4' });
    expect(model.describe(shift)).toMatchObject({ label: '⇧', caption: 'Shift', pressed: false });
    model.press(shift);
    expect(model.describe(shift).pressed).toBe(true);
    expect(model.describe(a).label).toBe('A');
    expect(model.describe({ type: 'layer', to: 'x', label: '?123' })).toEqual({
      label: '?123',
      name: '?123',
    });
    expect(model.describe({ type: 'text', value: '.' }).name).toBe('full stop');
    model.press(altgr);
    expect(model.describe(four)).toEqual({ label: '€', name: 'euro' });
    // A vowel sign sits on a dotted circle.
    expect(model.describe({ type: 'text', value: 'ा' }).label).toBe('◌ा');
  });

  it('gives the same snapshot until something changes, and tells subscribers when it does', () => {
    const { model } = open();
    const first = model.getState();
    expect(model.getState()).toBe(first);
    const listener = vi.fn();
    const stop = model.subscribe(listener);
    model.press(shift);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(model.getState()).not.toBe(first);
    stop();
    model.press(shift);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('tells subscribers about a new layout, or changes it quietly for a render in progress', () => {
    const { model } = open();
    const listener = vi.fn();
    model.subscribe(listener);
    const other = { ...layout, id: 'yy', layers: { only: [[{ type: 'text', value: 'z' }]] } };
    model.setLayout(other, { silent: true });
    expect(listener).not.toHaveBeenCalled();
    expect(model.getState().layer).toBe('only');
    expect(model.layout).toBe(other);
    model.setLayout(layout);
    expect(listener).toHaveBeenCalledTimes(1);
    model.setLayout(layout);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(model.getState().layer).toBe('letters');
  });

  it('uses the callbacks it has been given last, without losing its state', () => {
    const { model, onKey } = open();
    model.press(shift);
    const next = vi.fn();
    model.setCallbacks({ onKey: next });
    model.press(a);
    expect(onKey).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith({ type: 'text', value: 'A' });
    // No onClose now: pressing hide does nothing.
    expect(() => model.press({ type: 'close' })).not.toThrow();
  });

  it('works with no callbacks at all', () => {
    const model = createKeyboardModel({ layout });
    expect(() => model.press(a)).not.toThrow();
  });
});
