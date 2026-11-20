/* Phase 0 spikes: the existing React keyboard and helpers, run inside shadow roots in a real browser. */
import { createRoot } from 'react-dom/client';
import { Keyboard } from '@coldsofttech/saccade-keyboards';
import { applyKey } from '@coldsofttech/saccade-keyboards/core';
import { layout as english } from '@coldsofttech/saccade-en';
import { layout as urdu } from '@coldsofttech/saccade-ur';
import rawCss from '@coldsofttech/saccade-keyboards/style.css?raw';
import moduleCss from '@spike/keyboards-css';

window.events = [];
document.addEventListener('saccade-key', (event) => window.events.push(event.detail));

/** Types a key into a text field at its caret, as a host app would with `applyKey`. */
function typeInto(field, key) {
  const result = applyKey(
    field.value,
    { start: field.selectionStart ?? 0, end: field.selectionEnd ?? 0 },
    key,
  );
  field.value = result.text;
  field.setSelectionRange(result.selection.start, result.selection.end);
}

/** An open shadow root on a host, with a stylesheet adopted into it when there is one. */
function shadowOf(id, css) {
  const host = document.getElementById(id);
  const shadow = host.attachShadow({ mode: 'open' });
  if (css) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    shadow.adoptedStyleSheets = [sheet];
  }
  const mount = document.createElement('div');
  shadow.append(mount);
  return { host, shadow, mount };
}

/** Draws the existing React keyboard into a shadow root. */
function keyboardIn(id, css, props) {
  const { host, mount } = shadowOf(id, css);
  createRoot(mount).render(
    <Keyboard
      {...props}
      onKey={(key) => {
        props.onKey?.(key);
        // What the element will do: tell the page, across the shadow boundary.
        host.dispatchEvent(
          new CustomEvent('saccade-key', { detail: key, bubbles: true, composed: true }),
        );
      }}
    />,
  );
  return host;
}

// A: a field in the page (light DOM), a keyboard in a shadow root beside it.
keyboardIn('kbA', rawCss, {
  layout: english,
  onKey: (key) => typeInto(document.getElementById('field'), key),
});

// B: a field inside another component's shadow root.
{
  const { shadow } = shadowOf('fieldHost');
  const input = document.createElement('input');
  input.id = 'shadowField';
  input.value = 'world';
  shadow.append(input);
  keyboardIn('kbB', rawCss, { layout: english, onKey: (key) => typeInto(input, key) });
}

// C: Urdu (right to left) on a right-to-left page: the keys must still sit left to right.
keyboardIn('kbC', rawCss, { layout: urdu, onKey: () => {} });

// D: a keyboard in a box whose width the test changes (the container query).
keyboardIn('kbD', rawCss, { layout: english, onKey: () => {} });

// E: no stylesheet at all (control), F: the stylesheet from the CSS-as-JS module.
keyboardIn('kbE', null, { layout: english, onKey: () => {} });
keyboardIn('kbF', moduleCss, { layout: english, onKey: () => {} });

// Resolving a `for` attribute: from the element's own root, which may be the document or a shadow root.
class Probe extends HTMLElement {
  connectedCallback() {
    const target = this.getRootNode().querySelector(this.getAttribute('for'));
    this.dataset.found = target ? target.id : 'none';
  }
}
customElements.define('saccade-probe', Probe);
const lightProbe = document.createElement('saccade-probe');
lightProbe.setAttribute('for', '#field');
lightProbe.id = 'lightProbe';
document.getElementById('probes').append(lightProbe);
{
  const shadow = document.getElementById('fieldHost').shadowRoot;
  const probe = document.createElement('saccade-probe');
  probe.setAttribute('for', '#shadowField');
  probe.id = 'shadowProbe';
  shadow.append(probe);
}
