import { describe, expect, it } from 'vitest';
import {
  bottomRow,
  cased,
  keys,
  numpadRows,
  physicalRows,
  symbolsLayer,
  validateLayout,
} from './layout.js';

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

  it('leaves the row of digits out of the symbols layer when there are none', () => {
    const withDigits = symbolsLayer('123', toLetters);
    const without = symbolsLayer('', toLetters);
    expect(without).toHaveLength(withDigits.length - 1);
    expect(without).toEqual(withDigits.slice(1));
  });

  it('checks the row span of a key', () => {
    const tall = (rowSpan) => ({
      ...layout,
      layers: { letters: [[{ type: 'enter', rowSpan }], bottomRow(toSymbols)], symbols: [[]] },
    });
    expect(validateLayout(tall(2)).join()).not.toContain('rowSpan');
    expect(validateLayout(tall(0)).join()).toContain('rowSpan');
    expect(validateLayout(tall(1.5)).join()).toContain('rowSpan');
  });

  it('builds the four rows of a physical keyboard', () => {
    const options = {
      letters: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'],
      digits: ['1234567890', '!@#$%^&*()'],
      end2: ['[]', '{}'],
      end3: [';', ':'],
      end4: [',.', '<>'],
    };
    const ansi = physicalRows(options);
    expect(ansi).toHaveLength(4);
    expect(ansi[0].at(-1).type).toBe('backspace');
    expect(ansi[2].at(-1).type).toBe('enter');
    const iso = physicalRows({ ...options, iso: true, extra4: ['\\', '|'] });
    expect(iso[1].at(-1)).toMatchObject({ type: 'enter', rowSpan: 2 });
    expect(iso[2].some((key) => key.type === 'enter')).toBe(false);
    expect(iso[3][1].value).toBe('\\');
  });

  it('builds a number pad with a tall plus and Enter and a wide zero', () => {
    const rows = numpadRows(',');
    expect(rows).toHaveLength(5);
    expect(rows[0].map((key) => key.value ?? key.type)).toEqual(['numlock', '/', '*', '-']);
    expect(rows[1].at(-1)).toMatchObject({ value: '+', rowSpan: 2 });
    expect(rows[3].at(-1)).toMatchObject({ type: 'enter', rowSpan: 2 });
    expect(rows[4][0]).toMatchObject({ value: '0', width: 2 });
    expect(rows[4][1].value).toBe(',');
    expect(rows.flat().filter((key) => key.numpad)).toHaveLength(11);
  });

  it('checks the decimal sign and the numpad mark', () => {
    expect(validateLayout({ ...layout, decimal: '' }).join()).toContain('decimal');
    expect(validateLayout({ ...layout, decimal: ',' })).toEqual([]);
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
