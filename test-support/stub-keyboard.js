// A keyboard built only from the shared runtime (the model, the shell and the element helper). It
// exists to prove the runtime and the conformance suite work end to end before the real keyboard is
// drawn by a controller (Phase 2): it draws a button for each key, as the real one will.
import { createKeyboardModel } from '../packages/saccade-keyboards/src/core/model.js';
import { createShell } from '../packages/saccade-keyboards/src/vanilla/shell.js';
import { defineElement } from '../packages/saccade-keyboards/src/element/define.js';

/**
 * @param {HTMLElement | ShadowRoot} container
 * @param {Record<string, any>} props
 */
export function createStubKeyboard(container, props) {
  const shell = createShell(container, props, { required: ['layout'] });
  const { root, h } = shell;
  const model = createKeyboardModel({
    layout: props.layout,
    onKey: (key) => shell.emit('onKey', key),
    onClose: () => shell.emit('onClose'),
  });
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Test keyboard');

  function render() {
    const { rows } = model.getState();
    root.replaceChildren(
      ...rows.map((row) =>
        h(
          'div',
          null,
          row.map((key) => {
            const { label, name, pressed, disabled } = model.describe(key);
            return h(
              'button',
              {
                type: 'button',
                'aria-label': name,
                'aria-pressed': pressed === undefined ? null : String(pressed),
                disabled: disabled ? true : null,
                // Keep the focus (and the caret) in the field being typed into.
                onmousedown: (/** @type {Event} */ event) => event.preventDefault(),
                onclick: () => model.press(key),
              },
              label,
            );
          }),
        ),
      ),
    );
  }

  const stop = model.subscribe(render);
  shell.cleanup(stop);
  shell.onUpdate((changed, current) => {
    if (changed.includes('layout')) model.setLayout(current.layout);
  });
  render();
  return shell.api;
}

export const defineStubElement = defineElement({
  tag: 'saccade-stub',
  create: createStubKeyboard,
  ready: (props) => Boolean(props.layout),
  properties: ['layout'],
  events: { onKey: 'saccade-key', onClose: 'saccade-close' },
});
