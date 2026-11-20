# Saccade Keyboards without React

The same keyboard as the React demo, used from plain JavaScript and as a Web Component. There is no React in this app.

```bash
npm run build          # from the repository root: builds the packages first
npm run dev -w vanilla-demo
```

- `@coldsofttech/saccade-keyboards/element` registers `<saccade-keyboard>`. Put a layout in its `layout` property. Set `theme`, `label`, `font`, `font-size`, `numpad` and `currencypad` as attributes. Each key press is a `saccade-key` event (`event.detail` is `{ type, value? }`), and the hide key is `saccade-close`.
- `@coldsofttech/saccade-keyboards/vanilla` exports `createKeyboard(container, props)`, which returns `{ element, update, destroy }`. Import `@coldsofttech/saccade-keyboards/style.css` with it.

The keyboard edits nothing: this app types into the text field with `applyKey` from `@coldsofttech/saccade-keyboards/core`. See `src/main.js`.
