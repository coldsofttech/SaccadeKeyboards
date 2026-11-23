# Saccade Keyboards without React

The same keyboard as the React demo, used from plain JavaScript and as a Web Component. There is no React in this app.

```bash
npm run build          # from the repository root: builds the packages first
npm run dev -w vanilla-demo
```

- `@coldsofttech/saccade-keyboards/element` registers `<saccade-keyboard>`. Set `language` (a registered code such as `en`) or put a layout object in its `layout` property. Set `fallback` (text shown while a language loads), `theme`, `label`, `font`, `font-size`, `numpad` and `currencypad` as attributes. Each key press is a `saccade-key` event (`event.detail` is `{ type, value? }`), the hide key is `saccade-close`, and a language that loads or fails is `saccade-ready` or `saccade-error`.
- `@coldsofttech/saccade-keyboards/vanilla` exports `createKeyboard(container, props)`, which returns `{ element, update, destroy }`. It takes a `layout` or a `language`, plus `fallback`, `onReady` and `onError`. Import `@coldsofttech/saccade-keyboards/style.css` with it.
- A language is made available with `import '@coldsofttech/saccade-en/register'`, or `registerLanguage('ur', () => import('@coldsofttech/saccade-ur'))` from `/vanilla`. The layout loads when a keyboard first asks for it.

The keyboard edits nothing: this app types into the text field with `applyKey` from `@coldsofttech/saccade-keyboards/core`. See `src/main.js`.
