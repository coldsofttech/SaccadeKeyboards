# Security Policy

## Supported versions

Only the latest release of each `@coldsofttech/saccade-*` package receives security fixes.

## What counts as a vulnerability

Saccade Keyboards runs in the browser next to text that people type, so these are in scope:

- A keyboard or layout that makes the component run script, inject HTML or reach the host page
- A key press that is reported to the host app, or sent anywhere, other than through `onKey`
- Anything that makes the keyboard read or change the text field, or other data on the page, by itself
- A layout that crashes, freezes or exhausts memory in the component
- Vulnerabilities in a dependency that a package exposes to users

A key that types the wrong character is a bug, not a vulnerability. Use the **Layout fix** form for it.

## Reporting a vulnerability

Please do **not** report vulnerabilities in public issues.

Use GitHub's private reporting: go to the **Security** tab of this repository and choose **Report a vulnerability**.

Include the package and version, what you found, how to reproduce it, and the potential impact. You can expect an acknowledgement within a few days and updates as the fix progresses. Once a fix is released, we will credit you if you wish.
