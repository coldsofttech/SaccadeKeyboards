# Contributing

Thanks for taking the time to contribute! By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting bugs and requesting features

Open an issue using one of the provided forms. Search existing issues first. For security problems, do **not** open an issue; follow [SECURITY.md](SECURITY.md).

| Form                   | Use it for                                                                   |
| ---------------------- | ---------------------------------------------------------------------------- |
| Bug report             | The component or a keyboard does not work as expected                        |
| Layout fix             | A key is wrong, missing or in the wrong place on an existing keyboard        |
| New language           | A language that has no keyboard yet                                          |
| Region-specific layout | A regional variant of a language we have, such as another country's keyboard |
| Feature request        | A new option or an improvement to the component                              |

For layouts, a link to the official layout or a photo of a real keyboard is the most useful thing you can add. If you speak the language, say so: a native speaker checking the keys is the best way to get a layout right.

## How the repository is organized

Each language is its own npm package under `packages/`, named `@coldsofttech/saccade-<language code>`. `packages/saccade-keyboards` holds the `Keyboard` component and the code shared by every language. `examples/demo` is a small app for trying the packages. See [docs/development.md](docs/development.md) for the details and [docs/adding-a-language.md](docs/adding-a-language.md) to add a language or a region.

## Submitting changes

1. Fork the repository and create a branch from `main`.
2. Make your change, keeping it focused on one thing, ideally one package.
3. Install dependencies and the commit checks: `npm ci && pip install pre-commit && pre-commit install --hook-type pre-commit --hook-type post-commit`. Node 22 or newer is required (see `.nvmrc`).
4. Add or update tests for the package you changed. Components need an `axe` accessibility check, and every layout needs a test that runs `validateLayout`. You can run one package with `npx vitest run packages/saccade-fr`.
5. Add an entry under `[Unreleased]` in `CHANGELOG.md` (one or two lines, written from a reader's point of view). If you add or remove an export or option, update that package's README too.
6. Open a pull request and fill in the template.

## Code guidelines

- Plain JavaScript with JSDoc types, `.jsx` for components, named exports only.
- React and `react-dom` stay peer dependencies and are never bundled.
- Layouts are data. Follow the [layout format](docs/layout-format.md) and the real keyboard you are copying, key by key.
- The component never reads global state and never imports from an app. Data comes in through props and callbacks.
- Components must work with the keyboard and screen readers.
- Styles are CSS modules, shipped as one `style.css`.

## Pull request rules

- `main` is protected: changes land through pull requests that are squash-merged.
- Required checks must pass and the branch must be up to date.
- A code owner must review, and all conversations must be resolved.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/), for example `fix: handle empty input` or `feat: add saccade-ta Tamil keyboard`.
