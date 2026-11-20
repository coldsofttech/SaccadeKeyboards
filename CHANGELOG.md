# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `createKeyboardModel` in `@coldsofttech/saccade-keyboards/core`: the state and rules of the keyboard (shift, caps lock, AltGr, layers, Num Lock, the currency row) without markup or any framework. `useKeyboard` is now a thin hook over it.
- `registerLanguage`, `languages` and `loadLayout` are also exported from `@coldsofttech/saccade-keyboards/core`.

- `@coldsofttech/saccade-keyboards/vanilla`: `createKeyboard(container, props)` draws a keyboard for a layout object with no framework and returns `{ element, update, destroy }`.
- `@coldsofttech/saccade-keyboards/element`: the `<saccade-keyboard>` Web Component (Shadow DOM; attributes `theme`, `label`, `font`, `font-size`, `numpad`, `currencypad`; property `layout`; events `saccade-key`, `saccade-close`), and `/css` with its stylesheet text.
- `examples/vanilla`: an app with no React that types into a field with the element and with `createKeyboard`.
- `npm run verify:browser` checks all three entry points in Chromium (needs Playwright).

### Changed

- The React component for a layout object is now a thin wrapper over `createKeyboard`; its behaviour is unchanged.
- **Breaking:** `@coldsofttech/saccade-keyboards/core` no longer uses React. `Keyboard` (for a layout object) and `useKeyboard` moved from it to the main entry, `@coldsofttech/saccade-keyboards`, whose `Keyboard` already takes a `layout` prop. Change the import path; nothing else changes. The language packages are not affected.
- React and `react-dom` are now optional peer dependencies of `@coldsofttech/saccade-keyboards`, so an app with no React can use `/core`.
- `npm run check:packages` fails if `/core`, or a language package, can reach React.

## [0.1.0] - 2026-10-31

### Added

- On-screen keyboard for React with a built-in light and dark theme, picked by language or built from your own layout.
- The keyboard keeps a minimum width (430 px, or 600 px with the number pad) so its keys never overlap.
- Keyboards 800 px wide or less show only the typed character on each key; Shift and AltGr symbols appear when those keys are pressed.
- `currencypad` option adds a currency key before the space key that shows a row of currency symbols.
- Headless hook, a helper to apply key presses to text, and a layout checker for building custom keyboards.
- English keyboards for the US, GB, AU, CA and IN, Spanish keyboards for Spain, Mexico, Argentina, Colombia, the US and Latin America, and French keyboards for France, Belgium, Canada and Switzerland, with the letters in the order of the region or alphabetical.
- Hindi and Telugu keyboards in InScript and phonetic layouts, and Urdu keyboards in standard and phonetic layouts, with Latin or native digits.
- Keyboards laid out like real ones: number row, tall Enter, Shift, Caps Lock and AltGr, with keys that show both characters (such as 1 and !) and control keys that show an icon and a name.
- Optional number pad with Num Lock, and a decimal sign that follows the language.
- Choose the font of the keys: the device's own font (default), sans, serif, mono or any font you load.
