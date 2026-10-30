# Scripts

Helper scripts for maintaining the repository. They need Node 22 or newer and use no extra dependencies. Packages run them from their `check:packages` script.

## check-no-react.js

Fails if a built package bundles React instead of treating it as a peer dependency.

## check-pack.js

Fails if a package tarball contains anything other than build output and package metadata.
