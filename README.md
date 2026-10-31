# Saccade Keyboards

On-screen keyboards for React apps (React 18 and 19). Show a keyboard for a language next to any text field, with light and dark themes and full screen reader and keyboard support.

## What you get

- A keyboard you pick by language, or build from your own layout
- Light and dark themes, or your own colours, and a choice of font: the device's own, sans, serif or mono
- English and Spanish keyboards, with letters in QWERTY or alphabetical order
- Works with any input: the keyboard reports key presses and you decide where the text goes
- Keys that screen readers can read, and focus that stays in your text field
- Right-to-left and complex scripts, with a dotted circle shown for signs that sit on a letter
- Small bundle: React is never included, and each language is its own package

## Install

```bash
npm install @coldsofttech/saccade-keyboards @coldsofttech/saccade-en
```

React and `react-dom` 18 or 19 must be installed in your app.

## Use it

```jsx
import { Keyboard, registerLanguage } from '@coldsofttech/saccade-keyboards';
import '@coldsofttech/saccade-keyboards/style.css';

registerLanguage('en', () => import('@coldsofttech/saccade-en'));

<Keyboard language="en" onKey={(key) => console.log(key)} theme="dark" font="native" />;
```

Each language is installed separately. If one is missing, the keyboard tells you which package to install. For English with the letters in alphabetical order, pass `layout={createLayout('alphabetical')}` from `@coldsofttech/saccade-en` instead of `language`. See the [package guide](packages/saccade-keyboards/README.md) for all options, typing into a field, and building your own keyboard.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please report security issues privately as described in [SECURITY.md](SECURITY.md). Technical documentation is in [docs](docs/README.md).

## License

Released under the [MIT License](LICENSE).
