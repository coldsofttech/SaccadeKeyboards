import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findReactImports, importsOf } from './check-vanilla-no-react.js';

const dirs = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** Writes a fake built package: `files` maps a path under dist to its source. */
function fakePackage(files) {
  const root = mkdtempSync(join(tmpdir(), 'saccade-check-'));
  dirs.push(root);
  for (const [path, source] of Object.entries(files)) {
    const full = join(root, 'dist', path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, source);
  }
  return root;
}
const exportsMap = {
  '.': { import: './dist/index.js' },
  './core': { import: './dist/core/index.js' },
  './vanilla': { import: './dist/vanilla.js' },
  './element': './dist/element.js',
};

describe('importsOf', () => {
  it('finds static, re-export, side-effect and dynamic imports', () => {
    const source = `
      import a from './a.js';
      import { b, c } from "react";
      export { d } from './d.js';
      export * from './e.js';
      import './side.js';
      const m = await import('./lazy.js');
    `;
    expect(importsOf(source)).toEqual([
      './a.js',
      'react',
      './d.js',
      './e.js',
      './side.js',
      './lazy.js',
    ]);
  });
});

describe('findReactImports', () => {
  it('passes when the React-free entries reach no React, even though the root does', () => {
    const root = fakePackage({
      'index.js': "import { jsx } from 'react/jsx-runtime';",
      'core/index.js': "import { x } from './layout.js';",
      'core/layout.js': 'export const x = 1;',
      'vanilla.js': "import { x } from './core/layout.js';",
      'element.js': "import './vanilla.js';",
    });
    expect(findReactImports(root, exportsMap)).toEqual([]);
  });

  it('catches React imported directly, and through a chain of files', () => {
    const root = fakePackage({
      'core/index.js': "export * from './a.js';",
      'core/a.js': "import { useState } from 'react';",
      'vanilla.js': "import { createRoot } from 'react-dom/client';",
      'element.js': '',
    });
    expect(findReactImports(root, exportsMap)).toEqual([
      './core -> ./a.js -> react',
      './vanilla -> react-dom/client',
    ]);
  });

  it('catches the root of the keyboards package, which is React, but not its /core', () => {
    const root = fakePackage({
      'index.js': `
        import { Keyboard } from '@coldsofttech/saccade-keyboards';
        import { keys } from '@coldsofttech/saccade-keyboards/core';
      `,
    });
    expect(findReactImports(root, exportsMap, ['.'])).toEqual([
      '. -> @coldsofttech/saccade-keyboards',
    ]);
  });

  it('copes with import cycles, reports a missing build and ignores a package with no such entries', () => {
    const root = fakePackage({
      'vanilla.js': "import './b.js';",
      'b.js': "import './vanilla.js';",
    });
    expect(findReactImports(root, exportsMap, ['./vanilla'])).toEqual([]);
    expect(findReactImports(root, exportsMap, ['./element'])).toEqual([
      expect.stringMatching(/^\.\/element: .*does not exist/),
    ]);
    expect(findReactImports(fakePackage({}), { '.': './dist/index.js' })).toEqual([]);
  });
});
