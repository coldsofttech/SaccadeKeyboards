import { describe, expect, it } from 'vitest';
import { bottomRow, cased, keys, symbolsLayer, validateLayout } from './layout.js';

const toSymbols = { type: 'layer', to: 'symbols', label: '?123' };
const toLetters = { type: 'layer', to: 'letters', label: 'abc' };

const layout = {
  id: 'xx',
  name: 'Test',
  dir: 'ltr',
  fonts: ['Test Sans'],
  layers: {
    letters: [[...cased('ab')], bottomRow(toSymbols)],
    symbols: symbolsLayer('123', toLetters),
  },
};

describe('layout helpers', () => {
  it('pairs each key with its shifted character', () => {
    expect(keys('ab', 'A')).toEqual([
      { type: 'text', value: 'a', shift: 'A' },
      { type: 'text', value: 'b' },
    ]);
  });

  it('types the capital of a cased letter with shift', () => {
    expect(cased('a')).toEqual([{ type: 'text', value: 'a', shift: 'A' }]);
  });
});

describe('validateLayout', () => {
  it('accepts a well-formed layout', () => {
    expect(validateLayout(layout)).toEqual([]);
  });

  it('rejects something that is not an object', () => {
    expect(validateLayout(null)).toEqual(['a layout must be an object']);
  });

  it('reports a missing id, name and direction', () => {
    const problems = validateLayout({ layers: layout.layers });
    expect(problems).toEqual([
      'id must be a non-empty string',
      'name must be a non-empty string',
      'dir must be "ltr" or "rtl"',
    ]);
  });

  it('reports a layer key that points nowhere', () => {
    const problems = validateLayout({ ...layout, layers: { letters: [[toSymbols]] } });
    expect(problems).toEqual(['layer "letters", row 1, key 1: no layer named "symbols"']);
  });

  it('reports an unknown key type and a bad width', () => {
    const problems = validateLayout({
      ...layout,
      layers: { letters: [[{ type: 'tab' }, { type: 'space', width: 0 }]] },
    });
    expect(problems).toEqual([
      'layer "letters", row 1, key 1: unknown key type "tab"',
      'layer "letters", row 1, key 2: width must be a positive number',
    ]);
  });

  it('reports a layout without layers', () => {
    expect(validateLayout({ ...layout, layers: {} })).toEqual([
      'layers must be an object with at least one layer',
    ]);
  });
});
