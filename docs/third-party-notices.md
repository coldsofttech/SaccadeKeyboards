# Third-party notices

Saccade Keyboards is released under the [MIT license](../LICENSE). This page lists what its packages depend on at runtime and the licenses they use. Development tools (test runners, linters, build tools) are not shipped and are not listed.

None of the packages has a runtime dependency, so there are no third-party licenses to carry along with them.

## Runtime dependencies

| Package                           | License | Runtime dependencies             |
| --------------------------------- | ------- | -------------------------------- |
| `@coldsofttech/saccade-keyboards` | MIT     | None                             |
| `@coldsofttech/saccade-en`        | MIT     | None (peer: `saccade-keyboards`) |
| `@coldsofttech/saccade-es`        | MIT     | None (peer: `saccade-keyboards`) |
| `@coldsofttech/saccade-fr`        | MIT     | None (peer: `saccade-keyboards`) |
| `@coldsofttech/saccade-hi`        | MIT     | None (peer: `saccade-keyboards`) |
| `@coldsofttech/saccade-te`        | MIT     | None (peer: `saccade-keyboards`) |
| `@coldsofttech/saccade-ur`        | MIT     | None (peer: `saccade-keyboards`) |

`react` and `react-dom` (18 or 19) are peer dependencies of `@coldsofttech/saccade-keyboards` that your app provides. They are never bundled, and they are released under the MIT license by their own authors.

## Notes

- **Fonts.** No font is bundled. The keys use the fonts of the device by default. If you load a font for a script, for example a Noto font, that font has its own license, which you accept when you add it to your app.
- **Layouts.** The keyboard layouts are plain data written for this project. They describe common keyboards and published layouts such as QWERTY, AZERTY and InScript, and contain no code from other projects.
- **Demo and tests.** The demo app and the tests use React, Vite and Vitest, which are development tools and are not part of any published package.
