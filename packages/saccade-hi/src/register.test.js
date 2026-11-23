import { languages, loadLayout, validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { describe, expect, it } from 'vitest';

describe('saccade-hi/register', () => {
  it('registers the language and loads a valid layout from it', async () => {
    expect(languages()).not.toContain('hi');
    await import('./register.js');
    expect(languages()).toContain('hi');
    const layout = await loadLayout('hi');
    expect(validateLayout(layout)).toEqual([]);
  });
});
