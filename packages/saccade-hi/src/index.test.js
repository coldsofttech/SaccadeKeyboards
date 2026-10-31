import { describe, expect, it } from 'vitest';
import { validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { createLayout, layout } from './index.js';

const flat = (l, name = 'letters') => new Map(Object.entries(l.layers)).get(name).flat();
const find = (l, value, name) => flat(l, name).find((key) => key.value === value);
const typed = (l) =>
  flat(l)
    .filter((key) => key.type === 'text')
    .flatMap((key) => [key.value, key.shift, key.altgr]);

describe('saccade-hi', () => {
  it('is a valid InScript layout with Latin digits by default', () => {
    expect(validateLayout(layout)).toEqual([]);
    expect(layout.id).toBe('hi-IN');
    expect(layout.name).toBe('Hindi (InScript)');
    expect(find(layout, '1').altgr).toBe('१');
  });

  it.each(['inscript', 'phonetic'])('is valid as %s with either digits', (type) => {
    for (const digits of ['latin', 'devanagari']) {
      expect(validateLayout(createLayout(type, digits))).toEqual([]);
    }
  });

  it('has the InScript consonants and vowels where the standard has them', () => {
    expect(find(layout, 'ब').shift).toBe('भ');
    expect(find(layout, 'ा').shift).toBe('आ');
    expect(find(layout, 'क').shift).toBe('ख');
    expect(find(layout, '्')).toBeDefined();
    expect(find(layout, '5').shift).toBe('ज्ञ');
  });

  it('types every Devanagari letter and sign of InScript once as its own character', () => {
    const all = typed(layout).filter((value) => /^[ऀ-ॿ]$/u.test(value ?? ''));
    expect(all).toContain('ङ');
    expect(all).toContain('ऋ');
    expect(all).toContain('ं');
    expect(all).toContain('ँ');
    expect(all).toContain('।');
  });

  it('swaps the digits with the other script on AltGr', () => {
    const dev = createLayout('inscript', 'devanagari');
    expect(find(dev, '१').altgr).toBe('1');
    expect(find(dev, '१').shift).toBe('ऍ');
    expect(find(dev, '1')).toBeUndefined();
  });

  it('has a phonetic layer with the vowel signs behind a layer key', () => {
    const phonetic = createLayout('phonetic');
    expect(phonetic.name).toBe('Hindi (phonetic)');
    expect(Object.keys(phonetic.layers)).toEqual(['letters', 'signs']);
    expect(flat(phonetic).some((key) => key.type === 'layer' && key.to === 'signs')).toBe(true);
    expect(find(phonetic, 'ा', 'signs')).toBeDefined();
    expect(find(phonetic, '्', 'signs')).toBeDefined();
    expect(
      flat(phonetic, 'signs').some((key) => key.type === 'layer' && key.to === 'letters'),
    ).toBe(true);
    expect(find(phonetic, 'क').shift).toBe('ख');
    expect(find(phonetic, 'ब').shift).toBe('भ');
  });

  it('names the signs for a screen reader', () => {
    expect(layout.names['्']).toBe('हलंत');
  });

  it('rejects an unknown arrangement or digits', () => {
    expect(() => createLayout('remington')).toThrow(/Unknown arrangement/);
    expect(() => createLayout('inscript', 'roman')).toThrow(/Unknown digits/);
  });
});
