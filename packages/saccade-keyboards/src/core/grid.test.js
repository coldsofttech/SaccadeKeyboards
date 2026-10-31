import { describe, expect, it } from 'vitest';
import { COLUMNS, placeKeys } from './grid.js';

const key = (value, extra = {}) => ({ type: 'text', value, ...extra });

describe('placeKeys', () => {
  it('fills every row with its keys, in proportion to their widths', () => {
    const [row] = placeKeys([[key('a'), key('b', { width: 2 }), key('c')]]);
    expect(row.map((placed) => placed.columnSpan)).toEqual([30, 60, 30]);
    expect(row.map((placed) => placed.column)).toEqual([1, 31, 91]);
  });

  it('hands out the spare columns so that a row is always full', () => {
    const [row] = placeKeys([Array.from({ length: 7 }, (_, i) => key(String(i)))]);
    expect(row.reduce((sum, placed) => sum + placed.columnSpan, 0)).toBe(COLUMNS);
  });

  it('keeps the columns of a tall key at the end of the rows below it', () => {
    const [top, below] = placeKeys([
      [key('a'), key('b'), { type: 'enter', width: 2, rowSpan: 2 }],
      [key('c'), key('d')],
    ]);
    const enter = top[2];
    expect(enter.rowSpan).toBe(2);
    expect(below.at(-1).column + below.at(-1).columnSpan - 1).toBe(enter.column - 1);
    expect(below[0].column).toBe(1);
    expect(below.reduce((sum, placed) => sum + placed.columnSpan, 0)).toBe(
      COLUMNS - enter.columnSpan,
    );
  });

  it('keeps the columns of a tall key at the start of the rows below it', () => {
    const [top, below] = placeKeys([[{ type: 'enter', rowSpan: 2 }, key('a')], [key('b')]]);
    expect(top[0].column).toBe(1);
    expect(below[0].column).toBe(top[0].columnSpan + 1);
  });
});
