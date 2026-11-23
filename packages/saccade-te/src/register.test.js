import { languages, loadLayout, validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { describe, expect, it } from 'vitest';

describe('saccade-te/register', () => {
  it('registers the language and loads a valid layout from it', async () => {
    expect(languages()).not.toContain('te');
    await import('./register.js');
    expect(languages()).toContain('te');
    const layout = await loadLayout('te');
    expect(validateLayout(layout)).toEqual([]);
  });
});
