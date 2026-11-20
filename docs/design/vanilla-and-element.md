# Design: vanilla JS and Web Component entry points

Status: **Phase 0 approved; Phases 1 and 2 built** (see [Phase 2](#phase-2-the-keyboard-on-all-three-entry-points)). `/core`
is React-free, the model exists and `useKeyboard` runs on it; `/vanilla`, `/element` and `/css` now
draw a keyboard for a layout object. The spikes in [spikes/phase0](spikes/phase0/run.mjs) back the
decisions below; their results are in [Spike results](#spike-results).

This follows the plan used for Fovea Viewers (React first, then plain JavaScript and Web Components
from the same code). Saccade Keyboards is much smaller, so each phase is lighter, but the goal and
the rules are the same.

## Goal

Let people who do not use React put the same keyboards on a page, and make the React component a thin
layer over that one implementation.

- **One implementation.** The keys, shift, caps lock, AltGr, Num Lock, layers, number pad, currency
  pad, themes and focus handling live in React-free code. The React `Keyboard` becomes a wrapper
  that runs it, so a fix lands once.
- **The React API stays.** The props of `Keyboard` do not change, and neither does what it does.
  One thing moves: see [`/core` becomes React-free](#core-becomes-react-free), which is the only
  breaking change.
- **New entry points** for everyone else: a function and a Web Component.

Not goals: a new look, new keys or languages, server-side rendering, a shared package with Fovea
Viewers (the small helpers are copied; see [Copied plumbing](#copied-plumbing)).

## Entry points

| Entry                                       | For                                    | What it gives you                                                                     |
| ------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------- |
| `@coldsofttech/saccade-keyboards`           | React                                  | `Keyboard` (a `language` or a `layout`), `useKeyboard`, the language registry         |
| `@coldsofttech/saccade-keyboards/vanilla`   | plain JavaScript, Vue, Svelte, Angular | `createKeyboard(container, props)`                                                    |
| `@coldsofttech/saccade-keyboards/element`   | HTML and any framework                 | the `<saccade-keyboard>` Web Component                                                |
| `@coldsofttech/saccade-keyboards/core`      | layout authors, anyone                 | **React-free**: the layout helpers, `applyKey`, `typedValue`, the model, the registry |
| `@coldsofttech/saccade-keyboards/css`       | the element                            | the CSS as a string                                                                   |
| `@coldsofttech/saccade-keyboards/style.css` | everyone drawing in the page           | unchanged                                                                             |

```js
// React (unchanged)
import { Keyboard } from '@coldsofttech/saccade-keyboards';
<Keyboard language="en" onKey={onKey} />;

// Plain JavaScript
import { createKeyboard, registerLanguage } from '@coldsofttech/saccade-keyboards/vanilla';
registerLanguage('en', () => import('@coldsofttech/saccade-en'));
const keyboard = createKeyboard(host, { language: 'en', onKey });
keyboard.update({ theme: 'dark' });
keyboard.destroy();
```

```html
<!-- Web Component -->
<script type="module">
  import '@coldsofttech/saccade-keyboards/element';
  import '@coldsofttech/saccade-en/register';
</script>
<input id="field" />
<saccade-keyboard language="en" for="#field"></saccade-keyboard>
```

### `/core` becomes React-free

Today `/core` exports React code (`Keyboard` for a layout object, and `useKeyboard`) beside the
layout helpers. The six language packages import only helpers from it, but any app that installs a
language would pull React in through that barrel. So `/core` becomes React-free.

| Today, from `/core`                                                                                                                                                              | After                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `keys`, `cased`, `physicalRows`, `numpadRows`, `bottomRow`, `symbolsLayer`, `shiftKey`, `capsKey`, `altGrKey`, `backspaceKey`, `PUNCTUATION_NAMES`, `validateLayout`, `applyKey` | stay                                                                                    |
| `typedValue`, `CURRENCY_SIGNS`                                                                                                                                                   | stay in `/core` (they are pure; today they sit in the hook's file)                      |
| `Keyboard` (for a layout object)                                                                                                                                                 | **removed from `/core`.** Use the root `Keyboard` with `layout={…}`                     |
| `useKeyboard`                                                                                                                                                                    | **moved to the root** (`import { useKeyboard } from '@coldsofttech/saccade-keyboards'`) |
| (new)                                                                                                                                                                            | `createKeyboardModel`, and the registry (`registerLanguage`, `languages`, `loadLayout`) |

Who is affected: the language packages and the demo use only helpers and `applyKey`, so they are
unaffected. Anyone importing `Keyboard` or `useKeyboard` from `/core` changes one import. The root
`Keyboard` already accepts `layout`, so nothing is lost. This is released as 0.2.0 with a migration
note in the changelog (the package is at 0.1.0).

The spike confirms the split is mechanical: every name the six language packages take from `/core`
(`altGrKey`, `backspaceKey`, `bottomRow`, `capsKey`, `keys`, `physicalRows`, `shiftKey`) is already
in a React-free file. The one React-importing engine module is `useKeyboard.js`, which also holds
`typedValue` and `CURRENCY_SIGNS`.

## The model

The state machine in `useKeyboard` becomes a framework-free store, and the hook becomes a wrapper.

```js
const model = createKeyboardModel({ layout, onKey, onClose });
model.getState(); // { layer, shift: 'off'|'once'|'caps', altGr, numLock, currencyOpen, rows }
model.press(key); // the same rules as today (shift once, caps, AltGr for one key, layers, …)
model.describe(key); // { label, caption?, name, pressed?, disabled? }
model.setLayout(layout);
model.setCallbacks({ onKey, onClose });
const stop = model.subscribe(() => render());
```

- **Same rules, same tests.** `useKeyboard.test.jsx` and `Keyboard.test.jsx` are the spec: they must
  pass against the wrapper unchanged before the React code is switched over.
- **`useKeyboard` stays** for people who draw their own keys in React: it becomes
  `useSyncExternalStore` over a model. People who draw their own keys without React use the model.
- Callbacks are read when called, so replacing `onKey` never resets the shift state.

## The controller contract

`createKeyboard(container, props)` returns `{ element, update, destroy }`.

```ts
type KeyboardProps = {
  layout?: Layout; // or:
  language?: string; // a registered code; the layout is loaded when needed
  fallback?: string | Node; // shown while a language loads
  field?: HTMLElement | string; // type into this input or textarea (see below)
  onKey: (key: KeyPress) => void;
  onClose?: () => void;
  onReady?: (layout: Layout) => void; // a language has loaded
  onError?: (error: Error) => void; // a language is missing or invalid
  theme?: 'light' | 'dark' | ThemeColors;
  label?: string;
  font?: string;
  fontSize?: number;
  numpad?: boolean;
  currencypad?: boolean;
};
```

Rules (the same as Fovea's, so React, the element and plain callers behave alike):

1. **Props are the React props**, same names, meanings and defaults. The new ones (`field`,
   `onReady`, `onError`, and `fallback` as a string or node) exist for the non-React entries; the React
   `Keyboard` keeps `fallback` as a React node.
2. **Ownership.** The controller adds one root element to the container and touches nothing else.
   `destroy()` removes it. The container may be a shadow root.
3. **`destroy()` is idempotent; `update()` after it does nothing.** Neither throws.
4. **`update` takes only what changes.** An equal value does nothing. Changing `language` loads the
   new layout and drops a result from an older load. A prop set to `undefined` goes back to its default.
5. **Callbacks are read when called**, and none runs after `destroy()`. Errors are reported through
   `onError`, and the keyboard shows the message as the React one does.
6. **Focus stays where it was.** Pressing a key must not move focus or the caret out of the field.
   Every key handles `mousedown` and prevents its default (the spike shows this holds for a mouse and
   for touch, in a shadow root, and for a field in another shadow root).
7. **No work at import.** Importing an entry touches no DOM; the element registers when its entry is
   imported, as in Fovea Viewers.

### Typing into a field

The keyboard "edits nothing": it says which key was pressed (`onKey`) and the app decides what to do,
usually with `applyKey`. Keeping that is the rule. Two small conveniences for the non-React entries:

- **`field`** (`for` on the element): an input or textarea (or a selector for one). The controller
  applies each key to it with `applyKey` at its caret, sets the value through the element's own
  setter, puts the caret back, and dispatches a bubbling `input` event so frameworks and listeners see
  the change. `onKey` is still called. Without `field`, nothing is typed: as today.
- A selector is resolved from the element's own root, with `getRootNode().querySelector(selector)`.
  The spike shows this finds a field in the page and one in the same shadow root. A field in a
  different shadow root cannot be named by selector; pass the element itself (`field` property).

## Web Component mapping

Tag `saccade-keyboard`.

| Prop                                     | Attribute        | Property                        | Notes                                                      |
| ---------------------------------------- | ---------------- | ------------------------------- | ---------------------------------------------------------- |
| `language`, `label`, `font`              | yes              | yes                             |                                                            |
| `theme`                                  | `light` / `dark` | yes (also an object of colours) |                                                            |
| `font-size`                              | yes (number)     | yes                             |                                                            |
| `numpad`, `currencypad`                  | yes (presence)   | yes                             | absent leaves the default (off); `numpad="false"` is false |
| `for`                                    | yes (selector)   | `field` (an element too)        |                                                            |
| `layout`                                 | no               | yes                             | an object                                                  |
| `onKey`, `onClose`, `onReady`, `onError` | no               | no                              | events (below)                                             |

Events are bubbling, composed `CustomEvent`s with the argument in `detail`:

| Callback  | Event           | `detail`           |
| --------- | --------------- | ------------------ |
| `onKey`   | `saccade-key`   | `{ type, value? }` |
| `onClose` | `saccade-close` | none               |
| `onReady` | `saccade-ready` | the layout         |
| `onError` | `saccade-error` | the `Error`        |

The spike confirms that a composed event from inside the shadow root reaches the document.

Lifecycle, shadow DOM and the buffering of props set before connection are the same as Fovea's
element helper: created when connected and when a layout or language is known, destroyed when
disconnected, an open shadow root with the CSS adopted into it (a `<style>` where
`adoptedStyleSheets` does not exist), and `:host { display: block }`. The keyboard keeps its own
`min-width` (430 px, 600 px with the number pad) and its own `dir="ltr"`.

## Registering languages

Both ways, as agreed:

1. **Explicit:** `registerLanguage('en', () => import('@coldsofttech/saccade-en'))`, exported from
   the root, `/core` and `/vanilla`. This is what the React docs show today.
2. **By import:** each language package gains a `/register` entry whose only job is that call, so
   `import '@coldsofttech/saccade-en/register'` makes `<saccade-keyboard language="en">` work. The
   entry has a side effect, so it is listed in `sideEffects`. A language package depends on the
   keyboards package as a peer, as now, and imports `registerLanguage` from `/core`.

The registry is already React-free (`registry.js` imports only `layout.js`), so moving it into `/core`
is a re-export. A missing language still says which package to install.

## Styles

Same plan as Fovea Viewers: the vanilla controller reuses the same CSS module as the React component.
A page's stylesheet does not reach a shadow root (the spike's control shows the keyboard unstyled
without an adopted sheet), so the element carries its CSS: a stub `src/style.css.js` that the build
fills with the text of `style.css` through a small Vite plugin, exported as `/css`. The spike built
the real package with that step and the keyboard is styled identically.

The responsive rule is a container query (`@container (max-width: 790px)`) on the keyboard's own box.
The spike shows it works inside a shadow root: the second and third characters hide at 600 px and show
at 900 px.

## Converging React on the controller

Once the controller passes the conformance suite, the React component is:

```jsx
export function Keyboard(props) {
  const host = useController(createKeyboard, props);
  return <div ref={host} />;
}
```

with Fovea's `useController` (copied): create once, pass props to `update` after each render, treat a
prop that is no longer given as `undefined`, and keep the controller across StrictMode's remount.
`fallback` stays a React node for the React component (it renders it while the controller has no
layout), as `useKeyboard` stays a hook.

**Conformance suite.** One list of behaviours (a key calls `onKey` with the right value; shift applies
to the next key only; caps lock stays; AltGr is for one key; a layer key changes layer; the number
pad is off with Num Lock off; a language loads and a newer one wins over an older; a missing language
reports; `destroy` is idempotent; a prop that goes away resets; `field` types at the caret and fires
`input`; the focus and caret stay in the field) run through three adapters: the controller, the
element and the React component. `vitest-axe` runs on all three.

## Copied plumbing

About 200 lines, copied from Fovea Viewers (no shared package, so the two repositories stay
independent), then trimmed to what a keyboard needs:

- `defineViewerElement` → `defineKeyboardElement` (attributes, properties, events, shadow root,
  adopted CSS with a `<style>` fallback, buffering until connected).
- `createShell` (idempotent destroy, cancellable loads, callbacks read when called), simplified:
  there is no file to load, only a language.
- `scripts/vite-plugin-css-module.js` and its stub convention.
- `useController`, the conformance harness, and the React-free import check
  (`check-vanilla-no-react.js`), which also guards `/core`.

## Build and CI

- Multi-entry Vite build: `index`, `core/index`, `vanilla/index`, `element`, as in Fovea, with the
  CSS plugin. React is an optional peer dependency.
- `check-vanilla-no-react` follows every import from `/core`, `/vanilla`, `/element` and the language
  packages' entries, and fails if one reaches React.
- ESLint, for the same files: no global `document` (use the container's own document) and no React
  imports.
- A `browser` CI job and `npm run verify:browser`, as in Fovea Viewers, once Phase 2 exists.
- Language packages: a `/register` entry each, React stays out of them (they have no React peer now).

## Spike results

Run with `node docs/design/spikes/phase0/run.mjs` after `npm run build` (Chromium via Playwright,
which is not a repository dependency). 16 of 17 checks pass; the other is a finding for Phase 5.

| Question                                                                          | Result                                                    | What it means                                                       |
| --------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| Which engine files import React?                                                  | only `useKeyboard.js`                                     | the split is a file move, plus moving `typedValue`/`CURRENCY_SIGNS` |
| What do the language packages take from `/core`?                                  | seven layout helpers, all React-free already              | language packages need no change except `/register`                 |
| A field in the page keeps focus and caret while keys in a shadow root are pressed | yes, with a mouse click and with a touch tap              | `mousedown` + `preventDefault` is enough; shadow DOM is safe        |
| A field inside another component's shadow root                                    | keeps focus too (`shadow.activeElement`)                  | `field` can be an element in any root                               |
| A composed `CustomEvent` from the shadow root                                     | reaches `document`                                        | `saccade-key` works for listeners anywhere                          |
| `for="#id"` from `getRootNode().querySelector`                                    | finds a field in the page and one in the same shadow root | `for` is feasible; cross-root needs the `field` property            |
| `@container` rule inside a shadow root                                            | hints hide at 600 px, show at 900 px                      | no change to the responsive CSS                                     |
| Urdu keyboard on a `dir="rtl"` page                                               | keys stay left to right; `dir="ltr"`, `lang="ur-PK"` kept | the physical-layout rule survives                                   |
| The page's `button { color: red }`                                                | does not reach the keys                                   | isolation is real                                                   |
| CSS as a JS string from the real build, adopted into the shadow root              | styles the keyboard like the file does                    | the CSS plan holds                                                  |
| Control: no adopted sheet                                                         | unstyled                                                  | a `style.css` import cannot serve the element                       |
| axe-core on the keyboard in its shadow root                                       | **finding:** `label-content-name-mismatch` on 6 keys      | see below                                                           |

**Finding for Phase 5.** A key that shows two characters (`2` with `@` above it) has the accessible
name of the character it types (`2`), but its visible text is both (`@2`), so the name does not
contain all the visible text (WCAG 2.5.3). The characters are drawn in `aria-hidden` spans, which axe
still counts as visible. Options: name the key by both (`2, at sign`, which would also let a screen
reader user know the shifted character), or make the second character a pseudo-element so it is not
text. Decide in Phase 5 with a screen reader if one is available.

## Decisions agreed so far

1. `/core` becomes React-free (a breaking move of `Keyboard` and `useKeyboard`, released as 0.2.0).
2. The element helper and build plugin are copied; no shared package.
3. Languages register both ways: `registerLanguage`, and a `/register` entry on each language package.
4. A `for` attribute (and a `field` property) types into a field with `applyKey`.
5. Open Shadow DOM for the element.

## Phases

| Phase | Scope                                                                                                                                                                                   | Gate                                                                        |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 0     | This document and the spikes                                                                                                                                                            | design approved                                                             |
| 1     | The React-free core: the model (and `useKeyboard` over it), `typedValue` and the registry in `/core`, the `/core` break, the copied plumbing, the import check, the conformance harness | existing tests green; `/core` imports no React; harness runs on a stub      |
| 2     | The keyboard on all three entry points for a layout object: `createKeyboard`, `<saccade-keyboard>`, the React wrapper; focus handling; the CSS plugin and `/css`                        | conformance suite passes on all three; browser check; React tests unchanged |
| 3     | Languages: `language`, `fallback`, `onReady`/`onError`, a newer language wins, `registerLanguage` on `/vanilla`, the `/register` entry on the six language packages                     | the element works after one language import                                 |
| 4     | Features and edge cases: number pad, currency pad, themes and fonts, the narrow layout, `field`/`for` typing with `input` events, touch, IME and selection edge cases                   | each feature in the suite and in a real browser                             |
| 5     | Release: axe in a real browser (light, dark and custom themes) and the two-character key name, a React 18 run, version 0.2.0, README and docs, an example app, the CI browser job       | release candidate                                                           |

Each phase ends with something shippable and a gate for you to approve. The React component keeps
working until the phase that switches it to the controller (Phase 2), and the React tests are the
safety net.

## Phase 1: the React-free core

**What was built**

| Where                                  | What                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/model.js`                        | `createKeyboardModel`: the state and rules from `useKeyboard`, with no React. `getState`, `subscribe`, `press`, `describe`, `setLayout`, `setCallbacks` |
| `core/typed.js`                        | `typedValue` and `CURRENCY_SIGNS`, moved out of the hook's file                                                                                         |
| `core/registry.js`                     | the language registry (`registerLanguage`, `languages`, `loadLayout`), moved into `core`; the root re-exports it                                        |
| `useKeyboard.js`, `LayoutKeyboard.jsx` | moved out of `core`: the hook is now `useSyncExternalStore` over the model, and the layout-only component is the root `Keyboard`'s inner part           |
| `vanilla/shell.js`, `vanilla/h.js`     | copied from Fovea Viewers: idempotent destroy, cancellable loads, callbacks read when called; a safe element builder                                    |
| `element/define.js`                    | copied and trimmed: attributes, properties, events, an open shadow root with the CSS adopted (or a `<style>`), buffering until `ready`                  |
| `useController.js`                     | copied: the React side of a wrapper, with its StrictMode and removed-prop rules                                                                         |
| `scripts/`                             | `vite-plugin-css-module.js` (and its test) and `check-vanilla-no-react.js` (and its test)                                                               |
| `test-support/`                        | the conformance suite, the vanilla, element and React adapters, and a stub keyboard built from the shared runtime                                       |

The old tests were the spec. All 56 tests that existed before (`useKeyboard`, the layout-only
`Keyboard`, the language `Keyboard`, `applyKey`, `grid`, `layout`) pass against the model-based hook
and the moved components, with only their import paths changed. There are 237 tests now: the model
(13), the copied plumbing, the scripts, and 12 conformance behaviours for each of three adapters
(vanilla, element, React). Breaking the AltGr rule in the model on purpose makes six of them fail.

**The `/core` break** is as designed: `Keyboard` and `useKeyboard` left `/core`; the root has both.
The README has a "Moving from 0.1" note and the changelog lists it as breaking. React is an optional
peer dependency now.

**The React-free guarantee is enforced three ways.** `check-vanilla-no-react` follows every import from
`./core` (and, with `--entries .`, from each of the six language packages) through the built files;
ESLint forbids React imports, the React-only modules and the global `document` in `core`, `vanilla`,
`element` and the language packages; and `core` has no React peer. A probe file with all three
violations fails lint.

**Findings and choices**

1. **A new layout is applied while rendering.** `useKeyboard` must show the new layout's keys in the
   same render. `setLayout(layout, { silent: true })` changes the model without telling listeners and is
   idempotent, so it is safe twice in StrictMode; a normal `setLayout` tells subscribers.
2. **Callbacks do not trigger renders.** `setCallbacks` only stores them, so replacing `onKey` neither
   renders nor resets the shift state. The conformance suite checks this on all three adapters.
3. **jsdom 31 has constructable stylesheets.** Fovea Viewers' jsdom 30 did not, so the element helper's
   tests here stub `CSSStyleSheet` away to test the `<style>` fallback, and test sharing on the real one.
4. **The plumbing is unused until Phase 2.** The shell, `h`, the element helper, `useController` and the
   CSS plugin are only reached from tests, so they are not in `dist` yet. They are tested now so Phase 2
   can build on them.
5. **Size.** The root entry grew from just under 4 kB to 4.03 kB (the model is a little larger than the
   hook it replaces); its limit is 4.5 kB. `core` is 3.1 kB.

Next: Phase 2, the keyboard on all three entry points: `createKeyboard` for a layout object, the
`<saccade-keyboard>` element, and the React component as a wrapper over the controller.

## Phase 2: the keyboard on all three entry points

Status: **built**. A keyboard for a layout object works as a function, a Web Component and the React
component, and the React component is now a thin wrapper over the function.

- **`createKeyboard(container, props)`** (`/vanilla`) follows the controller contract: it returns
  `{ element, update, destroy }`. It draws the keys with the same classes as before, keeps the button
  elements across state changes (only labels, `aria-pressed`, `disabled` and classes change) and rebuilds
  them only when the structure changes (rows, number pad, currency row, decimal). When it rebuilds it
  puts the focus back on the key in the same place, also inside a shadow root.
- **`<saccade-keyboard>`** (`/element`) is made by the copied element helper: Shadow DOM, the CSS adopted
  from `/css`, the attributes `theme`, `label`, `font`, `font-size`, `numpad` and `currencypad`, the
  property `layout`, and the events `saccade-key` and `saccade-close`. It stays empty until `layout` is
  set. Importing the module registers the tag; `defineKeyboardElement()` registers it again safely.
- **React** (`LayoutKeyboard`) is `useController(createKeyboard, props)` and a `<div>`. All 140 earlier
  React tests pass without a change.
- **CSS** is delivered by the build plugin: `/css` exports the stylesheet text for shadow roots, and
  `style.css` still works for pages that draw with `createKeyboard`.

**Checked in Chromium** (`npm run verify:browser`, needs Playwright; not a repository dependency):
the `examples/vanilla` app ships no React; the element and the function type at the caret of a text
field and the field keeps the focus, with mouse and with touch; Enter on a focused key keeps the focus on
it; after a layer key the focus is on the key in the same place; second characters hide at 790 px and
under (the container query works in a shadow root); `theme`, `numpad` and `update()` change the keyboard;
the React component and `useKeyboard` work in a small React app.

**Findings**

1. **Page-level `--saccade-*` variables do not recolour the keyboard.** The root sets its own colours, so
   a variable on the page or on the host never wins. Only the `theme` prop or attribute sets colours.
   This is the same as before for React, but it matters more for a Web Component, where CSS variables are
   the usual way to theme. Decision for Phase 4: let host variables be the defaults the theme falls back to.
2. **axe reports two kinds of issue** in the real browser: `label-content-name-mismatch` on keys with two
   visible characters (the known Phase 0 finding) and `color-contrast` on some hint characters. Both are
   Phase 5 work; the check lists them as a note rather than failing.
3. **Size.** The root entry is 5.2 kB now because it holds the controller the wrapper runs (limit raised
   from 4.5 to 5.5 kB); `/vanilla` is 3.98 kB (limit 4.5) and `/element` 5.33 kB (limit 6).

Next: Phase 3, language support: `language`, `fallback`, `onReady` and `onError`, `registerLanguage` on
`/vanilla`, and the per-language `/register` entries.
