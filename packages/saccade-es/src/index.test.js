import { describe, expect, it } from 'vitest';
import { validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { createLayout, layout } from './index.js';

const ALPHABET = 'abcdefghijklmnñopqrstuvwxyz';

const typed = (l, layer) =>
  new Map(Object.entries(l.layers))
    .get(layer)
    .flat()
    .filter((key) => key.type === 'text')
    .map((key) => key.value);
const lettersOf = (l) => typed(l, 'letters').filter((value) => ALPHABET.includes(value));
const shifted = (l, value) => l.layers.letters.flat().find((key) => key.value === value)?.shift;
const altgr = (l, value) => l.layers.letters.flat().find((key) => key.value === value)?.altgr;

describe('saccade-es', () => {
  it('is a valid layout in QWERTY order by default', () => {
    expect(validateLayout(layout)).toEqual([]);
    expect(layout.id).toBe('es-ES');
    expect(lettersOf(layout).slice(0, 10).join('')).toBe('qwertyuiop');
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

  it('starts with the number row of a Spanish keyboard and ends it with backspace', () => {
    const [first] = layout.layers.letters;
    expect(first.map((key) => key.value ?? key.type).join('')).toBe("º1234567890'¡backspace");
    expect(shifted(layout, '2')).toBe('"');
    expect(shifted(layout, '1')).toBe('!');
  });

  it('has the inverted marks on the number row and next to the space bar', () => {
    expect(shifted(layout, "'")).toBe('?');
    expect(shifted(layout, '¡')).toBe('¿');
    const last = layout.layers.letters.at(-1).map((key) => key.value ?? key.type);
    expect(last).toEqual(expect.arrayContaining(['¿', '¡', 'space']));
  });

  it('has the accented vowels and the ü on AltGr, capitalised with shift', () => {
    expect(['a', 'e', 'i', 'o', 'u', 'y'].map((value) => altgr(layout, value)).join('')).toBe(
      'áéíóúü',
    );
    expect(Object.keys(layout.layers)).toEqual(['letters']);
  });

  it('has what a Spanish keyboard types with AltGr', () => {
    expect(['º', '1', '2', '3', '4', '5'].map((value) => altgr(layout, value)).join('')).toBe(
      '\\|@#~€',
    );
    expect(['`', '+', '´', 'ç'].map((value) => altgr(layout, value)).join('')).toBe('[]{}');
  });

  it('has what a Latin American keyboard types with AltGr', () => {
    const latam = createLayout('qwerty', 'MX');
    expect(['1', '2', '4', "'"].map((value) => altgr(latam, value)).join('')).toBe('|@~\\');
    expect(altgr(latam, '´')).toBe('^');
  });

  it('names the characters Spanish adds', () => {
    expect(layout.names['¿']).toBeTruthy();
    expect(layout.names['€']).toBe('euro');
  });

  it.each([
    ['ES', 'es-ES'],
    ['MX', 'es-MX'],
    ['AR', 'es-AR'],
    ['CO', 'es-CO'],
    ['US', 'es-US'],
    ['LATAM', 'es-419'],
  ])('is valid for %s as %s with the euro on AltGr', (region, id) => {
    const built = createLayout('qwerty', region);
    expect(validateLayout(built)).toEqual([]);
    expect(built.id).toBe(id);
    expect(altgr(built, '5')).toBe('€');
  });

  it('has the keys of a Latin American keyboard there, and of a Spanish one in Spain', () => {
    expect(layout.layers.letters[0].at(0).value).toBe('º');
    expect(createLayout('qwerty', 'MX').layers.letters[0].at(0).value).toBe('|');
    expect(shifted(createLayout('qwerty', 'MX'), '7')).toBe('/');
  });

  it('has a tall Enter beside rows 2 and 3', () => {
    const [, row2, row3] = layout.layers.letters;
    expect(row2.at(-1)).toMatchObject({ type: 'enter', rowSpan: 2 });
    expect(row3.some((key) => key.type === 'enter')).toBe(false);
  });

  it('has shift and caps lock keys on the letters layer', () => {
    const types = layout.layers.letters.flat().map((key) => key.type);
    expect(types).toContain('shift');
    expect(types).toContain('caps');
  });

  it('ends with an AltGr key, the space bar and a hide key', () => {
    const last = layout.layers.letters.at(-1);
    expect(last.at(0).type).toBe('altgr');
    expect(last.map((key) => key.type)).toContain('space');
    expect(last.at(-1).type).toBe('close');
  });

  it('uses the decimal sign of the region on the number pad', () => {
    expect(layout.decimal).toBe(',');
    expect(createLayout('qwerty', 'MX').decimal).toBe('.');
    expect(createLayout('qwerty', 'AR').decimal).toBe(',');
  });

  it('rejects an unknown region', () => {
    expect(() => createLayout('qwerty', 'FR')).toThrow(/Unknown region "FR"/);
  });

  it('rejects an unknown arrangement', () => {
    expect(() => createLayout('dvorak')).toThrow(/Unknown arrangement "dvorak"/);
  });
});
