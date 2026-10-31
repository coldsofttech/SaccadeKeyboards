import { describe, expect, it } from 'vitest';
import { validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { createLayout, layout } from './index.js';

const letters = (l) =>
  l.layers.letters
    .flat()
    .filter((key) => key.type === 'text' && /^[a-z]$/.test(key.value))
    .map((key) => key.value);

describe('saccade-en', () => {
  it('is a valid layout in QWERTY order by default', () => {
    expect(validateLayout(layout)).toEqual([]);
    expect(layout.id).toBe('en');
    expect(letters(layout).slice(0, 10).join('')).toBe('qwertyuiop');
  });

  it.each(['qwerty', 'alphabetical'])('has all 26 letters once in %s', (type) => {
    const built = createLayout(type);
    expect(validateLayout(built)).toEqual([]);
    expect([...letters(built)].sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz');
  });

  it('puts the letters in order when alphabetical', () => {
    expect(letters(createLayout('alphabetical')).join('')).toBe('abcdefghijklmnopqrstuvwxyz');
  });

  it('types capitals with shift', () => {
    const key = layout.layers.letters[0][0];
    expect(key).toMatchObject({ value: 'q', shift: 'Q' });
  });

  it('rejects an unknown arrangement', () => {
    expect(() => createLayout('dvorak')).toThrow(/Unknown arrangement "dvorak"/);
  });
});
