import { describe, expect, it } from 'vitest';
import { validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { createLayout, layout } from './index.js';

const typed = (l, layer) =>
  new Map(Object.entries(l.layers))
    .get(layer)
    .flat()
    .filter((key) => key.type === 'text')
    .map((key) => key.value);
const lettersOf = (l) => typed(l, 'letters').filter((value) => /\p{L}/u.test(value));

const ALPHABET = 'abcdefghijklmnñopqrstuvwxyz';

describe('saccade-es', () => {
  it('is a valid layout in QWERTY order by default', () => {
    expect(validateLayout(layout)).toEqual([]);
    expect(layout.id).toBe('es');
    expect(typed(layout, 'letters').slice(0, 10).join('')).toBe('qwertyuiop');
  });

  it.each(['qwerty', 'alphabetical'])('has all 27 letters once in %s', (type) => {
    const built = createLayout(type);
    expect(validateLayout(built)).toEqual([]);
    expect(lettersOf(built).sort().join('')).toBe([...ALPHABET].sort().join(''));
  });

  it('puts the letters in order, with ñ after n, when alphabetical', () => {
    expect(lettersOf(createLayout('alphabetical')).join('')).toBe(ALPHABET);
  });

  it('puts ñ after l on the QWERTY layer', () => {
    expect(lettersOf(layout).join('')).toContain('klñ');
  });

  it('has the accented vowels with capitals on their own layer', () => {
    const accents = layout.layers.accents.flat().filter((key) => key.shift);
    expect(accents.map((key) => key.value).join('')).toBe('áéíóúü');
    expect(accents.map((key) => key.shift).join('')).toBe('ÁÉÍÓÚÜ');
  });

  it('has ¿ and ¡ on the symbols layer and names them', () => {
    expect(typed(layout, 'symbols')).toEqual(expect.arrayContaining(['¿', '¡', '€']));
    expect(layout.names['¿']).toBeTruthy();
  });

  it('rejects an unknown arrangement', () => {
    expect(() => createLayout('dvorak')).toThrow(/Unknown arrangement "dvorak"/);
  });
});
