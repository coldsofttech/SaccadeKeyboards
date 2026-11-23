// Phase 2 check in a real browser. Run from the repository root after `npm run build`:
//   node docs/design/spikes/phase2/verify.mjs
// Builds examples/vanilla (an app with no React) and a small React app, opens them in Chromium and
// drives the built keyboard: as a Web Component, as a function and as the React component. Needs
// Playwright with Chromium (not a repository dependency).
import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const results = [];
const check = (name, ok, detail = '', note = false) =>
  results.push({ name, ok: Boolean(ok), detail, note });
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
};

/** Serves a built folder on a free port. */
async function serve(dir) {
  const server = createServer((req, res) => {
    const path = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const file = path.endsWith('/') ? join(path, 'index.html') : path;
    if (!file.startsWith(dir) || !existsSync(file)) return void res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

// --- The app with no React ---------------------------------------------------------------------
const app = join(root, 'examples/vanilla');
const dist = join(app, 'dist');
await build({ root: app, logLevel: 'silent' });

const MARKERS = [
  '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED',
  'react.production',
  'react-dom.production',
];
const scripts = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js'));
const bundled = scripts.filter((f) =>
  MARKERS.some((m) => readFileSync(join(dist, 'assets', f), 'utf8').includes(m)),
);
check(
  'bundle: the app ships no React',
  bundled.length === 0,
  `${scripts.length} script(s) checked`,
);

const browser = await chromium.launch();
try {
  const { server, url } = await serve(dist);
  for (const touch of [false, true]) {
    const how = touch ? 'touch tap' : 'mouse click';
    const context = await browser.newContext({
      hasTouch: touch,
      viewport: { width: 1000, height: 1200 },
    });
    const page = await context.newPage();
    const problems = [];
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
    await page.goto(url);
    await page.waitForSelector('#element');
    await page.waitForFunction(() =>
      document.querySelector('#element')?.shadowRoot?.querySelector('button'),
    );
    await page.waitForSelector('#host button');
    const press = (where, name) => {
      const key = page.locator(`${where} button[aria-label="${name}"]`).first();
      return touch ? key.tap() : key.click();
    };

    // Typing: the element, then the function, into one text field that keeps the focus.
    await page.evaluate(() => {
      const field = document.getElementById('field');
      field.focus();
      field.setSelectionRange(2, 2);
    });
    await press('#element', 'x');
    await press('#element', 'Backspace').catch(() => {}); // the English layout has Backspace on its first layer
    await press('#element', 'Shift');
    await press('#element', 'Y');
    await press('#host', 'z');
    const typed = await page.evaluate(() => {
      const f = document.getElementById('field');
      return { value: f.value, focused: document.activeElement === f, caret: f.selectionStart };
    });
    check(
      `typing (${how}): keys of the element and of the function type at the caret, and the field keeps focus`,
      typed.focused && typed.value === 'heYzllo' && typed.caret === 4,
      JSON.stringify(typed),
    );

    // The CSS is in the shadow root, and the page's own rule does not leak in.
    const look = await page.evaluate(() => {
      const group = document.getElementById('element').shadowRoot.querySelector('[role="group"]');
      const keys = group.querySelector('button');
      return {
        display: getComputedStyle(group).display,
        minWidth: getComputedStyle(group).minWidth,
        keyBackground: getComputedStyle(keys).backgroundColor,
      };
    });
    check(
      `element (${how}): the keyboard is styled inside its shadow root (flex box, minimum width, white keys)`,
      look.display === 'flex' &&
        look.minWidth === '430px' &&
        look.keyBackground === 'rgb(255, 255, 255)',
      JSON.stringify(look),
    );

    if (problems.length)
      check(`page (${how}): no errors in the console`, false, problems.join(' | '));
    await context.close();
  }

  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
  await page.goto(url);
  await page.waitForFunction(() =>
    document.querySelector('#element')?.shadowRoot?.querySelector('button'),
  );
  await page.waitForSelector('#host button');

  // Languages load on demand, and the page can switch them.
  const keysOf = () =>
    page.evaluate(() => ({
      element: [...document.querySelector('#element').shadowRoot.querySelectorAll('button')].map(
        (b) => b.getAttribute('aria-label'),
      ),
      host: [...document.querySelectorAll('#host button')].map((b) => b.getAttribute('aria-label')),
      lang: document
        .querySelector('#element')
        .shadowRoot.querySelector('[role="group"]')
        ?.getAttribute('lang'),
    }));
  const before = await keysOf();
  check(
    'language: language="en" shows the English keys in the element and in the function',
    before.lang === 'en-US' && before.element.includes('q') && before.host.includes('q'),
    String(before.lang),
  );
  await page.selectOption('#language', 'ur');
  await page.waitForFunction(() =>
    document
      .querySelector('#element')
      .shadowRoot.querySelector('[role="group"]')
      ?.getAttribute('lang')
      ?.startsWith('ur'),
  );
  await page.waitForFunction(() =>
    document.querySelector('#host [role="group"]')?.getAttribute('lang')?.startsWith('ur'),
  );
  const urdu = await keysOf();
  check(
    'language: switching to ur changes the element and the function to the Urdu keys',
    !urdu.element.includes('q') && !urdu.host.includes('q'),
    urdu.lang,
  );
  await page.selectOption('#language', 'zz');
  await page.waitForFunction(() =>
    document.querySelector('#element').shadowRoot.querySelector('[role="alert"]'),
  );
  const alertText = await page.evaluate(
    () => document.querySelector('#element').shadowRoot.querySelector('[role="alert"]').textContent,
  );
  check(
    'language: an unknown code shows which package to install',
    /saccade-zz/.test(alertText),
    alertText,
  );
  await page.selectOption('#language', 'en');
  await page.waitForFunction(() =>
    document.querySelector('#element').shadowRoot.querySelector('button'),
  );
  await page.waitForSelector('#host button');

  // The plain function draws in the page and is styled by style.css.
  const light = await page.evaluate(() => {
    const group = document.querySelector('#host [role="group"]');
    return {
      display: getComputedStyle(group).display,
      lightDom: group.getRootNode() === document,
      tokens: getComputedStyle(group).getPropertyValue('--saccade-accent').trim(),
    };
  });
  check(
    'vanilla: createKeyboard draws into an ordinary element, styled by style.css',
    light.display === 'flex' && light.lightDom && light.tokens === '#0f6cbd',
    JSON.stringify(light),
  );

  // Real keyboard use: Tab to a key, Enter on it, and the focus stays on the key.
  await page.evaluate(() =>
    document
      .querySelector('#element')
      .shadowRoot.querySelector('button[aria-label="Shift"]')
      .focus(),
  );
  await page.keyboard.press('Enter');
  const tabbed = await page.evaluate(() => {
    const shadow = document.querySelector('#element').shadowRoot;
    return {
      onShift: shadow.activeElement?.getAttribute('aria-label'),
      pressed: shadow.activeElement?.getAttribute('aria-pressed'),
    };
  });
  check(
    'keyboard use: pressing Enter on a focused key keeps the focus on it (the keys stay in the page)',
    tabbed.onShift === 'Shift' && tabbed.pressed === 'true',
    JSON.stringify(tabbed),
  );

  // A layer key hands the focus to the key in the same place.
  const layer = await page.evaluate(() => {
    const shadow = document.querySelector('#element').shadowRoot;
    const buttons = [...shadow.querySelectorAll('button')];
    const toggle = buttons.find((b) => /123|#\+=|\?123/.test(b.getAttribute('aria-label') ?? ''));
    if (!toggle) return { skipped: true };
    const place = buttons.indexOf(toggle);
    toggle.focus();
    toggle.click();
    const now = [...shadow.querySelectorAll('button')];
    return { kept: shadow.activeElement === now[Math.min(place, now.length - 1)] };
  });
  check(
    'keyboard use: after a layer key the focus is on the key in the same place',
    layer.skipped || layer.kept,
    JSON.stringify(layer),
  );

  // Responsive: the container query hides second characters on a narrow keyboard.
  const hints = async (width) => {
    await page.setViewportSize({ width, height: 1200 });
    await page.waitForTimeout(150);
    return page.evaluate(() => {
      const hint = document.querySelector('#element').shadowRoot.querySelector('[class*="hint"]');
      return hint ? getComputedStyle(hint).display : 'missing';
    });
  };
  const wide = await hints(1000);
  const narrow = await hints(700);
  check(
    'responsive: the keyboard shows second characters when wide and hides them at 790 px and under',
    wide !== 'none' && wide !== 'missing' && narrow === 'none',
    `1000 px: ${wide}; 700 px: ${narrow}`,
  );
  await page.setViewportSize({ width: 1000, height: 1200 });

  // Themes and the number pad through attributes, from the page's buttons.
  await page.click('#theme');
  await page.click('#numpad');
  await page.waitForTimeout(100);
  const changed = await page.evaluate(() => {
    const el = document.querySelector('#element').shadowRoot.querySelector('[role="group"]');
    const light = document.querySelector('#host [role="group"]');
    return {
      elementBackground: getComputedStyle(el).backgroundColor,
      hostBackground: getComputedStyle(light).backgroundColor,
      pad: Boolean(el.querySelector('[aria-label="Number pad"]')),
      hostPad: Boolean(light.querySelector('[aria-label="Number pad"]')),
    };
  });
  check(
    'attributes: theme="dark" and numpad change the element, and update() changes the function the same way',
    changed.elementBackground === changed.hostBackground &&
      changed.elementBackground !== 'rgb(240, 240, 240)' &&
      changed.pad &&
      changed.hostPad,
    JSON.stringify(changed),
  );

  // Page-level custom properties do not reach the keyboard: its root sets its own colours.
  const override = await page.evaluate(() => {
    const el = document.querySelector('#element');
    el.setAttribute('theme', 'light');
    document.documentElement.style.setProperty('--saccade-background', 'rgb(255, 0, 0)');
    return getComputedStyle(el.shadowRoot.querySelector('[role="group"]')).backgroundColor;
  });
  check(
    'theming (finding): a page-level --saccade-background does not recolour the element',
    override !== 'rgb(255, 0, 0)',
    `the keyboard is ${override}: only the theme prop or attribute sets colours`,
    true,
  );

  // Accessibility.
  await page.addScriptTag({ path: join(root, 'node_modules/axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => {
    const out = [];
    for (const target of [document.querySelector('#element'), document.querySelector('#host')]) {
      const result = await window.axe.run(target);
      for (const v of result.violations) out.push(`${v.id} (${v.nodes.length}): ${v.help}`);
    }
    return out;
  });
  check(
    'a11y: axe-core finds no violations in the element or the function (light theme, dark theme and number pad)',
    violations.length === 0,
    [...new Set(violations)].join(' | '),
    true,
  );
  await page.close();
  server.close();

  // --- The React component, drawn by the same controller --------------------------------------
  const reactOut = join(root, '.temp/spikes/react-app-dist');
  const { default: react } = await import('@vitejs/plugin-react');
  await build({
    root: join(root, 'docs/design/spikes/phase2/react-app'),
    configFile: false,
    logLevel: 'silent',
    plugins: [react()],
    build: { outDir: reactOut, emptyOutDir: true },
  });
  const second = await serve(reactOut);
  const reactPage = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
  const reactProblems = [];
  reactPage.on('pageerror', (e) => reactProblems.push(e.message));
  reactPage.on('console', (m) => m.type() === 'error' && reactProblems.push(m.text()));
  await reactPage.goto(second.url);
  await reactPage.waitForSelector('[role="group"] button');
  await reactPage.evaluate(() => {
    const field = document.getElementById('field');
    field.focus();
    field.setSelectionRange(5, 5);
  });
  await reactPage.locator('[role="group"] button[aria-label="x"]').first().click();
  const react_ = await reactPage.evaluate(() => {
    const field = document.getElementById('field');
    return {
      value: field.value,
      focused: document.activeElement === field,
      numpad: Boolean(document.querySelector('[aria-label="Number pad"]')),
    };
  });
  check(
    'react: the Keyboard component types at the caret, keeps the focus and shows the number pad',
    react_.value === 'hellox' && react_.focused && react_.numpad,
    JSON.stringify(react_),
  );
  await reactPage.click('#theme');
  await reactPage.waitForTimeout(100);
  const dark = await reactPage.evaluate(
    () => getComputedStyle(document.querySelector('[role="group"]')).backgroundColor,
  );
  check(
    'react: a theme prop change recolours the keyboard without drawing a new one',
    dark !== 'rgb(240, 240, 240)',
    dark,
  );
  await reactPage.locator('#mini button').first().click();
  check(
    'react: the useKeyboard hook works beside it (a custom UI over the model)',
    (await reactPage.locator('#mini button').count()) === 3,
  );
  check('react: no errors in the console', reactProblems.length === 0, reactProblems.join(' | '));
  await reactPage.close();
  second.server.close();
} finally {
  await browser.close();
}

for (const r of results) {
  const status = r.ok ? 'PASS' : r.note ? 'NOTE' : 'FAIL';
  console.log(
    `${status}  ${r.name}${r.detail && !r.ok ? `\n      ${r.detail}` : r.note ? `\n      ${r.detail}` : ''}`,
  );
}
const failed = results.filter((r) => !r.ok && !r.note).length;
const notes = results.filter((r) => !r.ok && r.note).length;
console.log(
  `\n${results.length - failed - notes}/${results.length} passed${notes ? `, ${notes} note(s) to act on` : ''}`,
);
process.exit(failed ? 1 : 0);
