// Adapters give the conformance suite one way to drive a keyboard, whichever entry point it is
// reached through: `mount(props, { host }) -> { root, update, destroy }`.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { useController } from '../packages/saccade-keyboards/src/useController.js';

/** The keyboard's own factory, called with a container. */
export function vanillaAdapter(create) {
  return {
    name: 'vanilla controller',
    acceptsShadowRoot: true,
    mount(props, { host, container = host }) {
      const keyboard = create(container, props);
      return { root: keyboard.element, update: keyboard.update, destroy: keyboard.destroy };
    },
  };
}

/** The Web Component: `define()` registers it and returns its class. */
export function elementAdapter(tag, define) {
  define(tag);
  const EVENTS = { onKey: 'saccade-key', onClose: 'saccade-close' };
  return {
    name: 'web component',
    acceptsShadowRoot: false,
    mount(props, { host }) {
      const element = document.createElement(tag);
      // Callbacks are events on an element. The latest one for each is the one that runs.
      const callbacks = {};
      for (const [callback, event] of Object.entries(EVENTS)) {
        element.addEventListener(event, (e) => callbacks[callback]?.(e.detail));
      }
      const apply = (values) => {
        for (const [name, value] of Object.entries(values)) {
          if (name in EVENTS) callbacks[name] = value;
          else element[name] = value;
        }
      };
      apply(props);
      host.append(element);
      return {
        get root() {
          return element.shadowRoot.querySelector('[data-saccade-root]');
        },
        update: apply,
        destroy() {
          element.remove();
        },
      };
    },
  };
}

/** A React component that wraps the controller, as the real keyboard's will. */
export function reactAdapter(create) {
  function Wrapper(props) {
    const host = useController(create, props);
    return <div ref={host} />;
  }
  return {
    name: 'react wrapper',
    acceptsShadowRoot: false,
    mount(props, { host }) {
      // React clears the container it renders into, so give it a container of its own.
      const container = document.createElement('div');
      host.append(container);
      const root = createRoot(container);
      let current = props;
      let destroyed = false;
      const render = () =>
        act(() =>
          root.render(
            <StrictMode>
              <Wrapper {...current} />
            </StrictMode>,
          ),
        );
      render();
      return {
        get root() {
          return container.querySelector('[data-saccade-root]');
        },
        update(next) {
          if (destroyed) return;
          current = { ...current, ...next };
          render();
        },
        destroy() {
          if (destroyed) return;
          destroyed = true;
          act(() => root.unmount());
          container.remove();
        },
      };
    },
  };
}

/** A keyboard's real React component, as users render it. */
export function reactComponentAdapter(Component) {
  return {
    name: 'react component',
    acceptsShadowRoot: false,
    mount(props, { host }) {
      // React clears the container it renders into, so give it a container of its own.
      const container = document.createElement('div');
      host.append(container);
      const root = createRoot(container);
      let current = props;
      let destroyed = false;
      const render = () =>
        act(() =>
          root.render(
            <StrictMode>
              <Component {...current} />
            </StrictMode>,
          ),
        );
      render();
      return {
        get root() {
          return container.querySelector('[data-saccade-root]');
        },
        update(next) {
          if (destroyed) return;
          current = { ...current, ...next };
          render();
        },
        destroy() {
          if (destroyed) return;
          destroyed = true;
          act(() => root.unmount());
          container.remove();
        },
      };
    },
  };
}
