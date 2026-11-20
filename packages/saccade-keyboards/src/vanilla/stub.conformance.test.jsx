import { describe, expect, it } from 'vitest';
import { describeConformance } from '../../../../test-support/conformance.js';
import {
  elementAdapter,
  reactAdapter,
  vanillaAdapter,
} from '../../../../test-support/adapters.jsx';
import { createStubKeyboard, defineStubElement } from '../../../../test-support/stub-keyboard.js';

// The suite every keyboard will run, run against a stub keyboard built from the shared runtime. It
// proves the model, the shell, the element helper and `useController` work together, and that all
// three adapters (vanilla, element and a React wrapper) behave the same.
describeConformance('stub', {
  adapters: [
    vanillaAdapter(createStubKeyboard),
    elementAdapter('saccade-stub', defineStubElement),
    reactAdapter(createStubKeyboard),
  ],
});

describe('stub keyboard', () => {
  it('throws a TypeError without a layout', () => {
    expect(() => createStubKeyboard(document.createElement('div'), {})).toThrow(TypeError);
  });
});
