import { describe, expect, it } from 'vitest';
import { validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { createLayout, layout } from './index.js';

const LETTERS = [...'ابپتٹثجچحخدڈذرڑزژسشصضطظعغفقکگلمنوہھءیےںۃئۓؤآ'];

const flat = (l, name = 'letters') => new Map(Object.entries(l.layers)).get(name).flat();
const find = (l, value, name) => flat(l, name).find((key) => key.value === value);
const typed = (l) =>
  flat(l)
    .filter((key) => key.type === 'text')
    .flatMap((key) => [key.value, key.shift, key.altgr]);

describe('saccade-ur', () => {
  it('is a valid right to left standard layout with Latin digits by default', () => {
    expect(validateLayout(layout)).toEqual([]);
    expect(layout.id).toBe('ur-PK');
    expect(layout.name).toBe('Urdu (standard)');
    expect(layout.dir).toBe('rtl');
    expect(find(layout, '1').altgr).toBe('۱');
  });

  it.each(['standard', 'phonetic'])('is valid as %s with either digits', (type) => {
    for (const digits of ['latin', 'urdu']) {
      expect(validateLayout(createLayout(type, digits))).toEqual([]);
    }
  });

  it.each(['standard', 'phonetic'])('can type every Urdu letter on the %s keyboard', (type) => {
    const all = typed(createLayout(type));
    expect(LETTERS.filter((letter) => !all.includes(letter))).toEqual([]);
  });

  it('puts a second letter on shift', () => {
    expect(find(layout, 'ا').shift).toBe('آ');
    expect(find(layout, 'ت').shift).toBe('ٹ');
  });

  it('swaps the digits with the other script on AltGr', () => {
    const urdu = createLayout('standard', 'urdu');
    expect(find(urdu, '۱').altgr).toBe('1');
    expect(find(urdu, '۱').shift).toBe('!');
    expect(find(urdu, '1')).toBeUndefined();
  });

  it('has a diacritics layer behind a layer key on both keyboards', () => {
    for (const type of ['standard', 'phonetic']) {
      const built = createLayout(type);
      expect(Object.keys(built.layers)).toEqual(['letters', 'marks']);
      expect(flat(built).some((key) => key.type === 'layer' && key.to === 'marks')).toBe(true);
      expect(find(built, 'ّ', 'marks')).toBeDefined();
      expect(find(built, 'َ', 'marks')).toBeDefined();
      expect(flat(built, 'marks').some((key) => key.type === 'layer' && key.to === 'letters')).toBe(
        true,
      );
    }
  });

  it('names the diacritics for a screen reader', () => {
    expect(layout.names['ّ']).toBe('تشدید');
  });

  it('rejects an unknown arrangement or digits', () => {
    expect(() => createLayout('remington')).toThrow(/Unknown arrangement/);
    expect(() => createLayout('standard', 'roman')).toThrow(/Unknown digits/);
  });
});
