import { languages, loadLayout, validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { describe, expect, it } from 'vitest';

describe('saccade-fr/register', () => {
  it('registers the language and loads a valid layout from it', async () => {
    expect(languages()).not.toContain('fr');
    await import('./register.js');
    expect(languages()).toContain('fr');
    const layout = await loadLayout('fr');
    expect(validateLayout(layout)).toEqual([]);
  });
});
