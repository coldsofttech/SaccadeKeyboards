# Adding a language

How to add a new language, a new arrangement of a language (such as a phonetic layout) or a new region. For what a layout contains, see [layout format](layout-format.md). Use `packages/saccade-en` as the reference, and `packages/saccade-fr` for a language with regions of its own.

## Before you start

- Find the official layout, or a photo of a real keyboard, for every layer: normal, Shift, AltGr and symbols. Copy it key by key.
- Ask a native speaker to check the result. Write down who checked it in the pull request.
- Open the **New language** or **Region-specific layout** issue form first if you want to agree on the scope.

## A new language

1. Create `packages/saccade-<code>`, copying the files of an existing language package. The package is named `@coldsofttech/saccade-<code>` and starts at version `0.1.0`.
2. Write the layouts in `src/index.js`. Export `layout` (the default) and `createLayout(arrangement, region)`, and list any font the script needs in `fonts`. `saccade-keyboards` is a peer dependency, imported from `@coldsofttech/saccade-keyboards/core`.
3. Add `src/index.test.js`. It runs `validateLayout` on every arrangement and region, and checks the keys that are easy to get wrong.
4. Add a `README.md` for the package: what it provides, its arrangements, regions and digits, and how to register it.
5. Add the package to `.size-limit.json`, to the demo in `examples/demo/src/main.jsx` (its layout, regions and arrangements) and to `examples/demo/package.json`.
6. Add it to the language table in the root `README.md`, to the bug report, feature request and layout fix forms in `.github/ISSUE_TEMPLATE`, and to the package list in [architecture](architecture.md).
7. Add an `[Unreleased]` entry in `CHANGELOG.md`.
8. Run `npm run build`, then `npm run check:packages`, then `npx vitest run packages/saccade-<code>`.

After the first release, register the package as a trusted publisher on npm (see [repository setup](repo-setup.md)).

## A new arrangement or region

1. Add it to the language's `createLayout`, reusing the shared helpers instead of repeating keys that do not change.
2. Add the region or arrangement to the test, so it is checked by `validateLayout`.
3. Add it to the demo, the language's README and the root README table.
4. Add an `[Unreleased]` entry in `CHANGELOG.md`.

## Checking your work

- Open the demo (`npm run build`, then `npm run dev`) and press every key on every layer.
- Look at the keyboard at 430 px and at 801 px or wider. At 800 px or less the Shift and AltGr characters are hidden until those keys are pressed.
- Check with the number pad and the currency pad on, and in the dark theme.
- Check a script that has signs sitting on a letter: they should show a dotted circle.
