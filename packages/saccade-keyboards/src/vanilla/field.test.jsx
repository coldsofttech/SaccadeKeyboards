import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { layout } from '../../../../test-support/conformance.js';
import {
  elementAdapter,
  reactComponentAdapter,
  vanillaAdapter,
} from '../../../../test-support/adapters.jsx';
import { LayoutKeyboard } from '../LayoutKeyboard.jsx';
import { defineKeyboardElement } from '../element.js';
import { createKeyboard } from './index.js';
import { resolveField, typeInto } from './typeInto.js';

afterEach(() => {
  document.body.replaceChildren();
});

/** A field in the page, with some text and the caret placed. */
function makeField(tag = 'textarea', value = 'hello', caret = 2, attributes = {}) {
  const field = document.createElement(tag);
  for (const [name, v] of Object.entries(attributes)) field.setAttribute(name, v);
  field.value = value;
  document.body.append(field);
  field.focus();
  try {
    field.setSelectionRange(caret, caret);
  } catch {
    // A number field has no selection.
  }
  return field;
}

describe('typeInto', () => {
  it('types at the caret, moves it, and fires a bubbling input event', () => {
    const field = makeField();
    const seen = vi.fn();
    document.addEventListener('input', seen);
    expect(typeInto(field, { type: 'text', value: 'X' })).toBe(true);
    expect(field.value).toBe('heXllo');
    expect(field.selectionStart).toBe(3);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen.mock.calls[0][0].inputType).toBe('insertText');
    expect(seen.mock.calls[0][0].data).toBe('X');
    document.removeEventListener('input', seen);
  });

  it('replaces a selection, backspaces, and adds a line break in a textarea', () => {
    const field = makeField('textarea', 'hello', 1);
    field.setSelectionRange(1, 4);
    typeInto(field, { type: 'text', value: 'a' });
    expect(field.value).toBe('hao');
    typeInto(field, { type: 'backspace' });
    expect(field.value).toBe('ho');
    typeInto(field, { type: 'enter' });
    expect(field.value).toBe('h\no');
  });

  it('does nothing for Enter in a single-line input, a disabled or read-only field, or a no-op key', () => {
    const input = makeField('input', 'ab', 1);
    expect(typeInto(input, { type: 'enter' })).toBe(false);
    expect(input.value).toBe('ab');
    input.setSelectionRange(0, 0);
    expect(typeInto(input, { type: 'backspace' })).toBe(false);
    input.readOnly = true;
    expect(typeInto(input, { type: 'text', value: 'x' })).toBe(false);
    input.readOnly = false;
    input.disabled = true;
    expect(typeInto(input, { type: 'text', value: 'x' })).toBe(false);
    expect(typeInto(document.body, { type: 'text', value: 'x' })).toBe(false);
  });

  it('keeps to maxlength but still lets a key replace or delete', () => {
    const input = makeField('input', 'abc', 3, { maxlength: '3' });
    expect(typeInto(input, { type: 'text', value: 'd' })).toBe(false);
    expect(input.value).toBe('abc');
    expect(typeInto(input, { type: 'backspace' })).toBe(true);
    expect(input.value).toBe('ab');
  });

  it('types at the end of a type that has no selection, such as number', () => {
    const input = makeField('input', '', 0, { type: 'number' });
    typeInto(input, { type: 'text', value: '1' });
    typeInto(input, { type: 'text', value: '2' });
    expect(input.value).toBe('12');
  });

  it('removes a whole character made of two code units', () => {
    const field = makeField('textarea', 'a😀', 3);
    typeInto(field, { type: 'backspace' });
    expect(field.value).toBe('a');
  });

  it('reaches a field a React component controls', () => {
    function Controlled() {
      const [value, setValue] = useState('hi');
      return (
        <input aria-label="controlled" value={value} onChange={(e) => setValue(e.target.value)} />
      );
    }
    render(<Controlled />);
    const input = screen.getByLabelText('controlled');
    input.focus();
    input.setSelectionRange(2, 2);
    act(() => {
      typeInto(input, { type: 'text', value: '!' });
    });
    expect(input.value).toBe('hi!');
  });
});

describe('resolveField', () => {
  it('finds a selector in the page, from a keyboard inside a shadow root, and from the same root', () => {
    const page = makeField('input');
    page.id = 'page';
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('input');
    inner.id = 'inner';
    shadow.append(inner);
    const keyboardRoot = document.createElement('div');
    shadow.append(keyboardRoot);
    expect(resolveField('#page', keyboardRoot)).toBe(page);
    expect(resolveField('#inner', keyboardRoot)).toBe(inner);
    expect(resolveField('#inner', document.body)).toBeNull();
    expect(resolveField('#nope', keyboardRoot)).toBeNull();
    expect(resolveField('[', keyboardRoot)).toBeNull();
    expect(resolveField(page, keyboardRoot)).toBe(page);
    expect(resolveField(undefined, keyboardRoot)).toBeNull();
  });
});

describe.each([
  ['controller', vanillaAdapter(createKeyboard)],
  ['element', elementAdapter('saccade-keyboard', defineKeyboardElement)],
  ['react component', reactComponentAdapter(LayoutKeyboard)],
])('the field prop on the %s', (_name, adapter) => {
  const open = (props) => {
    const host = document.createElement('div');
    document.body.append(host);
    const onKey = vi.fn();
    const mounted = adapter.mount({ layout, onKey, ...props }, { host });
    return { mounted, onKey };
  };
  const press = (mounted, name) =>
    act(() => mounted.root.querySelector(`button[aria-label="${name}"]`).click());

  it('types into an element, calls onKey too, and keeps the focus in the field', () => {
    const field = makeField();
    const { mounted, onKey } = open({ field });
    press(mounted, 'a');
    expect(field.value).toBe('heallo');
    expect(onKey).toHaveBeenCalledWith({ type: 'text', value: 'a' });
    mounted.destroy();
  });

  it('types into a selector, follows a changed field, and stops when it is taken away', () => {
    const first = makeField('input', '', 0);
    first.id = 'first';
    const second = makeField('input', '', 0);
    second.id = 'second';
    const { mounted } = open({ field: '#first' });
    press(mounted, 'a');
    mounted.update({ field: '#second' });
    press(mounted, 'b');
    mounted.update({ field: undefined });
    press(mounted, 'a');
    expect(first.value).toBe('a');
    expect(second.value).toBe('b');
    mounted.destroy();
  });
});

describe('the for attribute', () => {
  it('types into the field it names', async () => {
    defineKeyboardElement();
    const field = makeField('input', '', 0);
    field.id = 'target';
    const element = document.createElement('saccade-keyboard');
    element.setAttribute('for', '#target');
    element.layout = layout;
    document.body.append(element);
    element.shadowRoot.querySelector('button[aria-label="a"]').click();
    expect(field.value).toBe('a');
    expect(element.field).toBe('#target');
    fireEvent.input(field);
  });
});
