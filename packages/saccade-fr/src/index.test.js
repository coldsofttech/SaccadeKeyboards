import { describe, expect, it } from 'vitest';
import { validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { createLayout, layout } from './index.js';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const flat = (l) => l.layers.letters.flat();
const lettersOf = (l) =>
  flat(l)
    .filter((key) => key.type === 'text' && ALPHABET.includes(key.value))
    .map((key) => key.value);
const find = (l, value) => flat(l).find((key) => key.value === value);
const altgrOf = (l, values) => [...values].map((value) => find(l, value).altgr).join('');

describe('saccade-fr', () => {
  it('is a valid AZERTY layout for France by default', () => {
    expect(validateLayout(layout)).toEqual([]);
    expect(layout.id).toBe('fr-FR');
    expect(lettersOf(layout).slice(0, 10).join('')).toBe('azertyuiop');
  });

  it.each(['FR', 'BE', 'CA', 'CH'])('is valid for %s with all 26 letters once', (region) => {
    for (const type of ['azerty', 'alphabetical']) {
      const built = createLayout(type, region);
      expect(validateLayout(built)).toEqual([]);
      expect(built.id).toBe(`fr-${region}`);
      expect(lettersOf(built).sort().join('')).toBe(ALPHABET);
    }
  });

  it('has the letters of each region: AZERTY, QWERTY in Canada and QWERTZ in Switzerland', () => {
    expect(lettersOf(createLayout('azerty', 'BE')).slice(0, 10).join('')).toBe('azertyuiop');
    expect(lettersOf(createLayout('azerty', 'CA')).slice(0, 10).join('')).toBe('qwertyuiop');
    expect(lettersOf(createLayout('azerty', 'CH')).slice(0, 10).join('')).toBe('qwertzuiop');
  });

  it('puts the letters in order when alphabetical', () => {
    for (const region of ['FR', 'CA', 'CH']) {
      expect(lettersOf(createLayout('alphabetical', region)).join('')).toBe(ALPHABET);
    }
  });

  it('has the accented letters on the number row, with digits on shift', () => {
    const [row1] = layout.layers.letters;
    expect(row1.map((key) => key.value ?? key.type).join('')).toBe('²&é"\'(-è_çà)=backspace');
    expect(find(layout, 'é').shift).toBe('2');
    expect(find(layout, '&').shift).toBe('1');
    expect(find(layout, '²').shift).toBeUndefined();
  });

  it('types capital accented letters with caps lock', () => {
    const capitals = ['é', 'è', 'ç', 'à', 'ù'].map((value) => find(layout, value).capital);
    expect(capitals.join('')).toBe('ÉÈÇÀÙ');
  });

  it('has what a French keyboard types with AltGr, and the euro', () => {
    expect(altgrOf(layout, ['é', '"', "'", '(', '-', 'è', 'ç', 'à'])).toBe('~#{[|`^@');
    expect(find(layout, 'e').altgr).toBe('€');
  });

  it('has the circumflex and diaeresis vowels, the ligatures and the guillemets on AltGr', () => {
    expect(altgrOf(layout, 'azruiokjypqwx')).toBe('âêëûîôïüÿœæ«»');
    expect(find(createLayout('alphabetical'), 'a').altgr).toBe('â');
  });

  it('has the keys of each region', () => {
    expect(find(createLayout('azerty', 'BE'), '§').shift).toBe('6');
    expect(createLayout('azerty', 'CA').layers.letters[0][0].value).toBe('/');
    expect(find(createLayout('azerty', 'CH'), 'è').shift).toBe('ü');
    expect(createLayout('azerty', 'CH').layers.letters[0][0].value).toBe('§');
  });

  it('has a tall Enter, shift on both sides and an AltGr key', () => {
    const rows = layout.layers.letters;
    expect(rows[1].at(-1)).toMatchObject({ type: 'enter', rowSpan: 2 });
    expect(rows[3].at(0).type).toBe('shift');
    expect(rows[3].at(-1).type).toBe('shift');
    expect(rows.at(-1).at(0).type).toBe('altgr');
    expect(rows.at(-1).at(-1).type).toBe('close');
    expect(Object.keys(layout.layers)).toEqual(['letters']);
  });

  it('uses the decimal sign of the region on the number pad', () => {
    expect(layout.decimal).toBe(',');
    expect(createLayout('azerty', 'CA').decimal).toBe(',');
    expect(createLayout('azerty', 'CH').decimal).toBe('.');
  });

  it('names the characters French adds', () => {
    expect(layout.names['€']).toBe('euro');
    expect(layout.names['«']).toBeTruthy();
  });

  it('rejects an unknown region', () => {
    expect(() => createLayout('azerty', 'ES')).toThrow(/Unknown region "ES"/);
  });

  it('rejects an unknown arrangement', () => {
    expect(() => createLayout('qwerty')).toThrow(/Unknown arrangement "qwerty"/);
  });
});
