# Saccade Keyboards

[![CI](https://github.com/coldsofttech/SaccadeKeyboards/actions/workflows/ci.yml/badge.svg)](https://github.com/coldsofttech/SaccadeKeyboards/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@coldsofttech/saccade-keyboards.svg)](https://www.npmjs.com/package/@coldsofttech/saccade-keyboards)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React 18 | 19](https://img.shields.io/badge/react-18%20%7C%2019-61dafb.svg)](https://react.dev)

On-screen keyboards for React apps. Show a keyboard for a language next to any text field, so people can type in their own language on a device that has no keyboard for it. Install only the languages you need.

## Why Saccade Keyboards

- **Laid out like real keyboards.** Number row, tall Enter, Shift, Caps Lock and AltGr, with keys that show both characters (such as `1` and `!`).
- **Your language, your region.** Keyboards follow the layout people already know, such as QWERTY or AZERTY, and the keyboards of different countries.
- **Install only what you use.** Each language is its own package and is loaded the first time it is needed.
- **Works with any input.** The keyboard tells you which key was pressed and you decide where the text goes. The focus and the caret stay in your field.
- **Light and dark.** Built-in themes, your own colours, and a choice of font and key size.
- **Fits the space.** On a narrow keyboard (800 px or less) each key shows only the character it types, and Shift and AltGr show the rest when pressed.
- **Accessible.** Every key can be read by a screen reader and used from the keyboard.
- **Small.** React is never bundled, and there are no other dependencies.

## Languages

| Package                                           | Language | Layouts                                                         | Regions and digits                |
| ------------------------------------------------- | -------- | --------------------------------------------------------------- | --------------------------------- |
| [`@coldsofttech/saccade-en`](packages/saccade-en) | English  | QWERTY (the order of each region) or alphabetical               | US, GB, AU, CA, IN                |
| [`@coldsofttech/saccade-es`](packages/saccade-es) | Spanish  | The keyboard of each region, or alphabetical                    | ES, MX, AR, CO, US, Latin America |
| [`@coldsofttech/saccade-fr`](packages/saccade-fr) | French   | The keyboard of each region (AZERTY or QWERTZ), or alphabetical | FR, BE, CA, CH                    |
| [`@coldsofttech/saccade-hi`](packages/saccade-hi) | Hindi    | InScript or phonetic                                            | Latin or Devanagari digits        |
| [`@coldsofttech/saccade-te`](packages/saccade-te) | Telugu   | InScript or phonetic                                            | Latin or Telugu digits            |
| [`@coldsofttech/saccade-ur`](packages/saccade-ur) | Urdu     | Standard or phonetic                                            | Latin or Urdu digits              |

[`@coldsofttech/saccade-keyboards`](packages/saccade-keyboards/README.md) is the main package. It has the `Keyboard` component and loads a language only when needed.

Need another language or a keyboard from your country? [Ask for it](https://github.com/coldsofttech/SaccadeKeyboards/issues/new/choose), or see [adding a language](docs/adding-a-language.md) if you would like to write it.

## Install

```bash
npm install @coldsofttech/saccade-keyboards @coldsofttech/saccade-en
```

Add a package for each language you want. React and `react-dom` 18 or 19 must be installed in your app. Use a bundler that understands ES modules and dynamic `import()`, such as Vite, webpack or Rollup.

## Use it

```jsx
import { Keyboard, registerLanguage } from '@coldsofttech/saccade-keyboards';
import '@coldsofttech/saccade-keyboards/style.css';

registerLanguage('en', () => import('@coldsofttech/saccade-en'));

<Keyboard language="en" onKey={(key) => console.log(key)} theme="dark" font="native" />;
```

Each language is installed separately. If one is missing, the keyboard tells you which package to install. To pick a region or an arrangement, use the language package's `createLayout` and pass the result as `layout`:

```jsx
import { createLayout } from '@coldsofttech/saccade-fr';

<Keyboard layout={createLayout(undefined, 'BE')} onKey={onKey} />;
```

The [package guide](packages/saccade-keyboards/README.md) covers typing into a field, all the options (theme, font, number pad, currency key), sizing and building your own keyboard.

## Good to know

- **Size:** the keyboard fills the width of the element it sits in. It needs at least 430 px, or 600 px with the number pad.
- **Narrow keyboards:** at 800 px or less, each key shows only what it types. Press Shift or AltGr to see the other characters.
- **Right to left and complex scripts:** keys always sit left to right, like the keys on a real keyboard. A dotted circle is shown for signs that sit on a letter.
- **Client-side only:** the keyboard runs in the browser and sends nothing anywhere.

## Try it

The demo app lets you pick a language, region, theme, font, key size and width, and type into a text box.

```bash
npm ci
npm run build
npm run dev
```

## Documentation

- The [package guide](packages/saccade-keyboards/README.md) for all options.
- [CHANGELOG.md](CHANGELOG.md) for what changed.
- [docs/](docs/README.md) for how the repository works: [architecture](docs/architecture.md), [layout format](docs/layout-format.md), [adding a language](docs/adding-a-language.md), [development](docs/development.md), [security](docs/security.md), [third-party notices](docs/third-party-notices.md) and [repository setup](docs/repo-setup.md).
- [SUPPORT.md](SUPPORT.md) for where to ask questions and report bugs.

## Contributing

Languages and regional layouts are best written with someone who uses the keyboard every day, so native speakers are especially welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Please report security issues privately as described in [SECURITY.md](SECURITY.md). Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Released under the [MIT License](LICENSE).
