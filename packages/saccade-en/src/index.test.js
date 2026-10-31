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
    expect(layout.id).toBe('en-US');
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
    const key = layout.layers.letters[1][0];
    expect(key).toMatchObject({ value: 'q', shift: 'Q' });
  });

  it.each([
    ['US', '5', '€'],
    ['GB', '4', '€'],
    ['AU', '5', '€'],
    ['CA', '5', '€'],
    ['IN', '4', '₹'],
  ])('is valid for %s, with its currency sign on AltGr', (region, key, sign) => {
    const built = createLayout('qwerty', region);
    expect(validateLayout(built)).toEqual([]);
    expect(built.id).toBe(`en-${region}`);
    expect(altgr(built, key)).toBe(sign);
  });

  const shifted = (l, value) => l.layers.letters.flat().find((key) => key.value === value)?.shift;
  const altgr = (l, value) => l.layers.letters.flat().find((key) => key.value === value)?.altgr;

  it('has the symbols of each region on the number row', () => {
    expect(shifted(layout, '2')).toBe('@');
    expect(shifted(createLayout('qwerty', 'GB'), '2')).toBe('"');
    expect(shifted(createLayout('qwerty', 'GB'), '3')).toBe('£');
    expect(shifted(createLayout('qwerty', 'GB'), "'")).toBe('@');
  });

  it('accepts UK as GB', () => {
    expect(createLayout('qwerty', 'UK').id).toBe('en-GB');
  });

  it('starts with the number row and ends with backspace', () => {
    const [first] = layout.layers.letters;
    expect(first.map((key) => key.value ?? key.type).join('')).toBe('`1234567890-=backspace');
    expect(Object.keys(layout.layers)).toEqual(['letters']);
  });

  it('has the AltGr characters of the keyboard of each region', () => {
    const us = ['a', 'e', 'i', 'o', 'u', 'n', 'c'].map((v) => altgr(layout, v)).join('');
    expect(us).toBe('áéíóúñ©');
    const gb = createLayout('qwerty', 'GB');
    expect(['a', 'e', 'i', 'o', 'u', '`'].map((v) => altgr(gb, v)).join('')).toBe('áéíóú¦');
    expect(altgr(gb, 'n')).toBeUndefined();
    expect(altgr(createLayout('qwerty', 'IN'), 'a')).toBeUndefined();
  });

  it('keeps AltGr on the letter when the letters are alphabetical', () => {
    expect(altgr(createLayout('alphabetical'), 'e')).toBe('é');
  });

  it('has a tall Enter beside rows 2 and 3 on a British keyboard, and Enter on row 3 on a US one', () => {
    const [, row2, row3] = createLayout('qwerty', 'GB').layers.letters;
    expect(row2.at(-1)).toMatchObject({ type: 'enter', rowSpan: 2 });
    expect(row3.some((key) => key.type === 'enter')).toBe(false);
    const [, usRow2, usRow3] = layout.layers.letters;
    expect(usRow2.some((key) => key.type === 'enter')).toBe(false);
    expect(usRow3.at(-1).type).toBe('enter');
  });

  it('has a shift key on each side of the bottom row of letters', () => {
    const row4 = layout.layers.letters[3];
    expect(row4.at(0).type).toBe('shift');
    expect(row4.at(-1).type).toBe('shift');
  });

  it('ends with an AltGr key, the space bar and a hide key', () => {
    const last = layout.layers.letters.at(-1);
    expect(last.at(0).type).toBe('altgr');
    expect(last.map((key) => key.type)).toContain('space');
    expect(last.at(-1).type).toBe('close');
  });

  it('rejects an unknown region', () => {
    expect(() => createLayout('qwerty', 'FR')).toThrow(/Unknown region "FR"/);
  });

  it('rejects an unknown arrangement', () => {
    expect(() => createLayout('dvorak')).toThrow(/Unknown arrangement "dvorak"/);
  });
});
