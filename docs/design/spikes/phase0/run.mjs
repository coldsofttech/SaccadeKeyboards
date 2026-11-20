// Phase 0 spikes. Run from the repository root after `npm run build`:
//   node docs/design/spikes/phase0/run.mjs
// Builds a small consumer app, opens it in Chromium and reports what worked. Scratch output goes to
// `.temp/spikes/` (git-ignored). Needs Playwright with Chromium (not a repository dependency).
// See ../../vanilla-and-element.md for what the results mean.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const scratch = join(root, '.temp', 'spikes');
const appDir = join(root, 'docs/design/spikes/phase0/app');
const results = [];
// A `note` is a finding to act on in a later phase: it is reported, and does not fail the run.
const record = (name, ok, detail = '', note = false) =>
  results.push({ name, ok: Boolean(ok), detail, note });

// --- Static: what in the engine is React-free, and what the language packages need ----------------
const keyboards = join(root, 'packages/saccade-keyboards/src');
const read = (path) => readFileSync(path, 'utf8');
const exportsOf = (source) =>
  [...source.matchAll(/export (?:const|function|async function) (\w+)/g)].map((m) => m[1]);
const importsReact = (source) => /from ['"]react(-dom)?['"/]/.test(source);
const pureFiles = ['layout.js', 'grid.js', 'applyKey.js'];
const pureNames = new Set(
  pureFiles.flatMap((file) => exportsOf(read(join(keyboards, 'core', file)))),
);
record(
  'static: layout.js, grid.js, applyKey.js and registry.js import no React',
  [...pureFiles.map((f) => join(keyboards, 'core', f)), join(keyboards, 'registry.js')].every(
    (f) => !importsReact(read(f)),
  ),
);
const hookSource = read(join(keyboards, 'core/useKeyboard.js'));
record(
  'static: useKeyboard.js is the one engine module that imports React, and it also holds typedValue',
  importsReact(hookSource) && /export function typedValue/.test(hookSource),
  'typedValue and CURRENCY_SIGNS are pure but live next to the hook: they move to the React-free core',
);
const wanted = new Set();
for (const pkg of readdirSync(join(root, 'packages')).filter((n) =>
  /^saccade-(en|es|fr|hi|te|ur)$/.test(n),
)) {
  const source = read(join(root, 'packages', pkg, 'src/index.js'));
  const block = source.match(/import \{([^}]*)\} from '@coldsofttech\/saccade-keyboards\/core'/);
  for (const name of (block?.[1] ?? '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean))
    wanted.add(name);
}
const missing = [...wanted].filter((name) => !pureNames.has(name));
record(
  'static: every name the six language packages take from /core is already in a React-free file',
  missing.length === 0,
  `they use: ${[...wanted].sort().join(', ')}${missing.length ? `; NOT pure: ${missing.join(', ')}` : ''}`,
);

// --- Build: the CSS as a JS string, from the real package ---------------------------------------
const cssAsModule = {
  name: 'emit-css-as-module',
  enforce: 'post',
  generateBundle: {
    order: 'post',
    handler(_options, bundle) {
      const css = bundle['style.css'];
      if (css?.type === 'asset') {
        this.emitFile({
          type: 'asset',
          fileName: 'style.css.js',
          source: `export default ${JSON.stringify(String(css.source))};\n`,
        });
      }
    },
  },
};
const packageDir = join(root, 'packages/saccade-keyboards');
const cssOut = join(scratch, 'keyboards-dist');
await build({
  root: packageDir,
  configFile: join(packageDir, 'vite.config.js'),
  logLevel: 'silent',
  plugins: [cssAsModule],
  build: { outDir: cssOut, emptyOutDir: true, sourcemap: false },
});
record(
  'build: CSS-as-module (style.css.js) is emitted next to style.css',
  existsSync(join(cssOut, 'style.css.js')),
);

// --- The browser spikes, against a built consumer app ---------------------------------------------
const appOut = join(scratch, 'app-dist');
await build({
  root: appDir,
  configFile: false,
  logLevel: 'silent',
  plugins: [react()],
  resolve: { alias: { '@spike/keyboards-css': join(cssOut, 'style.css.js') } },
  build: { outDir: appOut, emptyOutDir: true },
});
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer((req, res) => {
  const path = join(appOut, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = path.endsWith('/') ? join(path, 'index.html') : path;
  if (!file.startsWith(appOut) || !existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
try {
  // Focus and the caret: a mouse click, then a touch tap, on a keyboard in a shadow root.
  for (const touch of [false, true]) {
    const context = await browser.newContext({
      hasTouch: touch,
      viewport: { width: 1000, height: 1400 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForSelector('#kbA button');
    const press = (host, name) => {
      const key = page.locator(`#${host} button[aria-label="${name}"]`).first();
      return touch ? key.tap() : key.click();
    };
    const how = touch ? 'touch tap' : 'mouse click';

    // A: a field in the light DOM.
    await page.evaluate(() => {
      const field = document.getElementById('field');
      field.focus();
      field.setSelectionRange(2, 2);
    });
    await press('kbA', 'x');
    await press('kbA', 'Backspace');
    await press('kbA', 'y');
    const a = await page.evaluate(() => {
      const f = document.getElementById('field');
      return { value: f.value, caret: f.selectionStart, focused: document.activeElement === f };
    });
    record(
      `focus (${how}): a field in the page keeps focus and caret while keys in a shadow root are pressed`,
      a.focused && a.value === 'heyllo' && a.caret === 3,
      JSON.stringify(a),
    );

    // The keys tell the page across the shadow boundary.
    const events = await page.evaluate(() => window.events.map((e) => e.type + (e.value ?? '')));
    record(
      `events (${how}): a composed CustomEvent from the shadow root reaches the document`,
      events.join(',') === 'textx,backspace,texty',
      events.join(','),
    );

    // B: a field in another component's shadow root.
    await page.evaluate(() => {
      const input = document.getElementById('fieldHost').shadowRoot.getElementById('shadowField');
      input.focus();
      input.setSelectionRange(5, 5);
    });
    await press('kbB', 'z');
    const b = await page.evaluate(() => {
      const shadow = document.getElementById('fieldHost').shadowRoot;
      const input = shadow.getElementById('shadowField');
      return {
        value: input.value,
        focused: shadow.activeElement === input,
        hostFocused: document.activeElement === document.getElementById('fieldHost'),
      };
    });
    record(
      `focus (${how}): a field inside another shadow root keeps focus too`,
      b.focused && b.hostFocused && b.value === 'worldz',
      JSON.stringify(b),
    );
    if (errors.length) record(`page (${how}): no uncaught errors`, false, errors.join(' | '));
    await context.close();
  }

  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
  await page.goto(url);
  await page.waitForSelector('#kbA button');

  // `for`: resolve a selector from the element's own root.
  const probes = await page.evaluate(() => ({
    light: document.getElementById('lightProbe').dataset.found,
    shadow: document.getElementById('fieldHost').shadowRoot.getElementById('shadowProbe').dataset
      .found,
  }));
  record(
    'for="#id": getRootNode().querySelector finds a field in the page and one in the same shadow root',
    probes.light === 'field' && probes.shadow === 'shadowField',
    JSON.stringify(probes),
  );

  // The container query hides the second and third characters on a narrow keyboard.
  const hintAt = async (width) => {
    await page.evaluate((w) => (document.getElementById('widthBox').style.width = `${w}px`), width);
    await page.waitForTimeout(100);
    return page.evaluate(() => {
      const hint = document.getElementById('kbD').shadowRoot.querySelector('[class*="hint"]');
      return hint ? getComputedStyle(hint).display : 'missing';
    });
  };
  const wide = await hintAt(900);
  const narrow = await hintAt(600);
  record(
    'responsive: the @container rule works inside a shadow root (hints hide at 790 px and under)',
    wide !== 'none' && wide !== 'missing' && narrow === 'none',
    `900 px: ${wide}; 600 px: ${narrow}`,
  );

  // Right to left page, Urdu keyboard: keys stay left to right.
  const order = await page.evaluate(() => {
    const keys = [...document.getElementById('kbC').shadowRoot.querySelectorAll('button')].slice(
      0,
      4,
    );
    const xs = keys.map((k) => k.getBoundingClientRect().left);
    const group = document.getElementById('kbC').shadowRoot.querySelector('[role="group"]');
    return {
      increasing: xs.every((x, i) => i === 0 || x > xs[i - 1]),
      dir: group.getAttribute('dir'),
      lang: group.getAttribute('lang'),
    };
  });
  record(
    'rtl: on a right-to-left page the keyboard keeps its own dir="ltr" and lang',
    order.increasing && order.dir === 'ltr' && order.lang.startsWith('ur'),
    JSON.stringify(order),
  );

  // CSS: page rules do not leak in; a sheet is needed in the shadow root; the module string works.
  const style = await page.evaluate(() => {
    const colourOf = (id) =>
      getComputedStyle(document.getElementById(id).shadowRoot.querySelector('button')).color;
    const displayOf = (id) =>
      getComputedStyle(document.getElementById(id).shadowRoot.querySelector('[role="group"]'))
        .display;
    return {
      leak: colourOf('kbA'),
      withSheet: displayOf('kbA'),
      withModule: displayOf('kbF'),
      without: displayOf('kbE'),
    };
  });
  record(
    "css: the page's `button { color: red }` does not reach the keys in a shadow root",
    style.leak !== 'rgb(255, 0, 0)',
    style.leak,
  );
  record(
    'css: the stylesheet from the CSS-as-JS module styles the keyboard like the file does',
    style.withModule === 'flex' && style.withSheet === 'flex',
    JSON.stringify(style),
  );
  record(
    'css (control): with no adopted sheet the keyboard is unstyled',
    style.without !== 'flex',
    style.without,
  );

  // Accessibility preview: axe on a keyboard inside its shadow root.
  await page.addScriptTag({ path: join(root, 'node_modules/axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document.getElementById('kbA'));
    return result.violations.map(
      (v) => `${v.id} (${v.nodes.length}): ${v.help}. ${v.nodes[0].html.slice(0, 90)}`,
    );
  });
  record(
    'a11y (preview): axe-core finds no violations in the keyboard in its shadow root',
    violations.length === 0,
    violations.join(' | '),
    true,
  );
  await page.close();
} finally {
  await browser.close();
  server.close();
}

mkdirSync(scratch, { recursive: true });
writeFileSync(join(scratch, 'results.json'), JSON.stringify(results, null, 2));
for (const r of results) {
  const status = r.ok ? 'PASS' : r.note ? 'NOTE' : 'FAIL';
  console.log(`${status}  ${r.name}\n      ${r.detail}`);
}
const failed = results.filter((r) => !r.ok && !r.note).length;
const notes = results.filter((r) => !r.ok && r.note).length;
console.log(
  `\n${results.length - failed - notes}/${results.length} passed${notes ? `, ${notes} note(s) to act on` : ''}`,
);
process.exit(failed ? 1 : 0);
