import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useKeyboard } from './useKeyboard.js';
import { bottomRow, cased, shiftKey } from './layout.js';

const layout = {
  id: 'xx',
  name: 'Test',
  dir: 'ltr',
  layers: {
    letters: [
      [shiftKey, ...cased('ab')],
      bottomRow({ type: 'layer', to: 'symbols', label: '?123' }),
    ],
    symbols: [[{ type: 'text', value: '1' }]],
  },
};
const shift = layout.layers.letters[0][0];
const a = layout.layers.letters[0][1];

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

    act(() => result.current.press(shift));
    act(() => result.current.press(shift));
    expect(result.current.shift).toBe('caps');
    act(() => result.current.press(a));
    act(() => result.current.press(a));
    expect(onKey).toHaveBeenLastCalledWith({ type: 'text', value: 'A' });
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
    expect(result.current.describe(shift)).toEqual({ label: '⇧', name: 'Shift', pressed: false });
  });
});
