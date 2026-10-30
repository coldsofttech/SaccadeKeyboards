import { describe, expect, it } from 'vitest';
import { applyKey } from './applyKey.js';

const caret = (at) => ({ start: at, end: at });

describe('applyKey', () => {
  it('types at the caret', () => {
    expect(applyKey('ac', caret(1), { type: 'text', value: 'b' })).toEqual({
      text: 'abc',
      selection: caret(2),
    });
  });

  it('replaces the selection', () => {
    expect(applyKey('abc', { start: 0, end: 2 }, { type: 'text', value: 'x' })).toEqual({
      text: 'xc',
      selection: caret(1),
    });
  });

  it('removes the character before the caret on backspace', () => {
    expect(applyKey('abc', caret(2), { type: 'backspace' })).toEqual({
      text: 'ac',
      selection: caret(1),
    });
  });

  it('removes the selection on backspace', () => {
    expect(applyKey('abc', { start: 2, end: 0 }, { type: 'backspace' })).toEqual({
      text: 'c',
      selection: caret(0),
    });
  });

  it('does nothing on backspace at the start', () => {
    expect(applyKey('abc', caret(0), { type: 'backspace' })).toEqual({
      text: 'abc',
      selection: caret(0),
    });
  });

  it('removes a whole code point on backspace', () => {
    expect(applyKey('a😀', caret(3), { type: 'backspace' })).toEqual({
      text: 'a',
      selection: caret(1),
    });
  });

  it('adds a line break on enter', () => {
    expect(applyKey('ab', caret(1), { type: 'enter' })).toEqual({
      text: 'a\nb',
      selection: caret(2),
    });
  });
});
