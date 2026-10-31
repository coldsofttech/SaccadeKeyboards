import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useKeyboard } from './useKeyboard.js';
import { bottomRow, capsKey, cased, shiftKey } from './layout.js';

const layout = {
  id: 'xx',
  name: 'Test',
  dir: 'ltr',
  layers: {
    letters: [
      [shiftKey, capsKey, ...cased('ab')],
      bottomRow({ type: 'layer', to: 'symbols', label: '?123' }),
    ],
    symbols: [[{ type: 'text', value: '1' }]],
  },
};
const [shift, caps] = layout.layers.letters[0];
const a = layout.layers.letters[0][2];

describe('useKeyboard', () => {
  it('turns shift off after one key, and keeps it on with caps', () => {
    const onKey = vi.fn();
    const { result } = renderHook(() => useKeyboard({ layout, onKey }));

    act(() => result.current.press(shift));
    act(() => result.current.press(a));
    act(() => result.current.press(a));
    expect(onKey.mock.calls).toEqual([
      [{ type: 'text', value: 'A' }],
      [{ type: 'text', value: 'a' }],
    ]);

    act(() => result.current.press(caps));
    expect(result.current.shift).toBe('caps');
    act(() => result.current.press(a));
    act(() => result.current.press(a));
    expect(onKey).toHaveBeenLastCalledWith({ type: 'text', value: 'A' });
    expect(onKey).toHaveBeenCalledTimes(4);
  });

  it('unlocks caps lock with the caps key or shift, and shift toggles off', () => {
    const { result } = renderHook(() => useKeyboard({ layout, onKey: vi.fn() }));
    act(() => result.current.press(caps));
    act(() => result.current.press(caps));
    expect(result.current.shift).toBe('off');
    act(() => result.current.press(caps));
    act(() => result.current.press(shift));
    expect(result.current.shift).toBe('off');
    act(() => result.current.press(shift));
    expect(result.current.shift).toBe('once');
    act(() => result.current.press(shift));
    expect(result.current.shift).toBe('off');
  });

  it('types the AltGr character of the next key only, capitalised with shift', () => {
    const onKey = vi.fn();
    const { result } = renderHook(() => useKeyboard({ layout, onKey }));
    const e = { type: 'text', value: 'e', shift: 'E', altgr: 'é' };
    const four = { type: 'text', value: '4', shift: '$', altgr: '€' };
    const altgr = { type: 'altgr' };

    act(() => result.current.press(altgr));
    expect(result.current.altGr).toBe(true);
    expect(result.current.describe(altgr).pressed).toBe(true);
    expect(result.current.describe(e).name).toBe('é');
    act(() => result.current.press(e));
    act(() => result.current.press(e));
    act(() => result.current.press(altgr));
    act(() => result.current.press(shift));
    act(() => result.current.press(e));
    act(() => result.current.press(caps));
    act(() => result.current.press(altgr));
    act(() => result.current.press(e));
    act(() => result.current.press(altgr));
    act(() => result.current.press(four));
    expect(onKey.mock.calls.map(([key]) => key.value)).toEqual(['é', 'e', 'É', 'É', '€']);
    expect(result.current.altGr).toBe(false);
  });

  it('types the capital of a key with caps lock, and its shifted character with shift', () => {
    const onKey = vi.fn();
    const { result } = renderHook(() => useKeyboard({ layout, onKey }));
    const accent = { type: 'text', value: 'é', shift: '2', capital: 'É' };
    act(() => result.current.press(caps));
    act(() => result.current.press(accent));
    act(() => result.current.press(caps));
    act(() => result.current.press(shift));
    act(() => result.current.press(accent));
    act(() => result.current.press(accent));
    expect(onKey.mock.calls.map(([key]) => key.value)).toEqual(['É', '2', 'é']);
  });

  it('types a key as usual after AltGr when it has no AltGr character', () => {
    const onKey = vi.fn();
    const { result } = renderHook(() => useKeyboard({ layout, onKey }));
    act(() => result.current.press({ type: 'altgr' }));
    act(() => result.current.press(a));
    expect(onKey).toHaveBeenCalledWith({ type: 'text', value: 'a' });
    expect(result.current.altGr).toBe(false);
  });

  it('turns the digits and the decimal key of the number pad off with Num Lock', () => {
    const onKey = vi.fn();
    const { result } = renderHook(() => useKeyboard({ layout, onKey }));
    const numlock = { type: 'numlock' };
    const seven = { type: 'text', value: '7', numpad: true };
    const plus = { type: 'text', value: '+' };
    expect(result.current.numLock).toBe(true);
    expect(result.current.describe(numlock)).toMatchObject({ pressed: true, name: 'Num lock' });
    act(() => result.current.press(seven));
    act(() => result.current.press(numlock));
    expect(result.current.numLock).toBe(false);
    expect(result.current.describe(seven).disabled).toBe(true);
    act(() => result.current.press(seven));
    act(() => result.current.press(plus));
    act(() => result.current.press(numlock));
    act(() => result.current.press(seven));
    expect(onKey.mock.calls.map(([key]) => key.value)).toEqual(['7', '+', '7']);
  });

  it('switches layer and clears shift', () => {
    const { result } = renderHook(() => useKeyboard({ layout, onKey: vi.fn() }));
    act(() => result.current.press(shift));
    act(() => result.current.press({ type: 'layer', to: 'symbols', label: '?123' }));
    expect(result.current.layer).toBe('symbols');
    expect(result.current.shift).toBe('off');
  });

  it('types a space and reports backspace, enter and close', () => {
    const onKey = vi.fn();
    const onClose = vi.fn();
    const { result } = renderHook(() => useKeyboard({ layout, onKey, onClose }));
    act(() => result.current.press({ type: 'space' }));
    act(() => result.current.press({ type: 'backspace' }));
    act(() => result.current.press({ type: 'enter' }));
    act(() => result.current.press({ type: 'close' }));
    expect(onKey.mock.calls).toEqual([
      [{ type: 'text', value: ' ' }],
      [{ type: 'backspace' }],
      [{ type: 'enter' }],
    ]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('falls back to the first layer when the layout changes', () => {
    const other = { ...layout, layers: { only: layout.layers.symbols } };
    const { result, rerender } = renderHook(
      ({ current }) => useKeyboard({ layout: current, onKey: vi.fn() }),
      {
        initialProps: { current: layout },
      },
    );
    act(() => result.current.press({ type: 'layer', to: 'symbols', label: '?123' }));
    rerender({ current: other });
    expect(result.current.layer).toBe('only');
  });

  it('describes keys for a screen reader', () => {
    const { result } = renderHook(() => useKeyboard({ layout, onKey: vi.fn() }));
    expect(result.current.describe({ type: 'text', value: ',' }).name).toBe('comma');
    expect(result.current.describe({ type: 'text', value: '्' }).label).toBe('◌्');
    expect(result.current.describe(shift)).toEqual({
      label: '⇧',
      caption: 'Shift',
      name: 'Shift',
      pressed: false,
    });
    expect(result.current.describe(caps)).toEqual({
      label: '⇪',
      caption: 'Caps',
      name: 'Caps lock',
      pressed: false,
    });
  });
});
