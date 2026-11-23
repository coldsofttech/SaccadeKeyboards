import { languages, loadLayout, validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { describe, expect, it } from 'vitest';

describe('saccade-en/register', () => {
  it('registers the language and loads a valid layout from it', async () => {
    expect(languages()).not.toContain('en');
    await import('./register.js');
    expect(languages()).toContain('en');
    const layout = await loadLayout('en');
    expect(validateLayout(layout)).toEqual([]);
  });
});
