import { languages, loadLayout, validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { describe, expect, it } from 'vitest';

describe('saccade-es/register', () => {
  it('registers the language and loads a valid layout from it', async () => {
    expect(languages()).not.toContain('es');
    await import('./register.js');
    expect(languages()).toContain('es');
    const layout = await loadLayout('es');
    expect(validateLayout(layout)).toEqual([]);
  });
});
