# Scripts

Helper scripts for maintaining the repository. They need Node 22 or newer and use no extra dependencies. Packages run them from their `check:packages` script.

## check-vanilla-no-react.js

Follows every import from the entry points that must not use React (`./core`, and later `./vanilla` and `./element`, or `.` of a language package with `--entries .`) through the built files, and fails if one reaches React or the main entry of the keyboards package. A shared chunk that pulls in a React component is caught as well as a direct import.

## vite-plugin-css-module.js

A Vite plugin for the keyboards package's library build, for its Web Component (Phase 2): it fills a stub `src/style.css.js` with the text of `style.css`, so the element carries its own CSS. A page's stylesheet does not reach a shadow root.

## check-no-react.js

Fails if a built package bundles React instead of treating it as a peer dependency.

## check-pack.js

Fails if a package tarball contains anything other than build output and package metadata.
