import { languages, loadLayout, validateLayout } from '@coldsofttech/saccade-keyboards/core';
import { describe, expect, it } from 'vitest';

describe('saccade-ur/register', () => {
  it('registers the language and loads a valid layout from it', async () => {
    expect(languages()).not.toContain('ur');
    await import('./register.js');
    expect(languages()).toContain('ur');
    const layout = await loadLayout('ur');
    expect(validateLayout(layout)).toEqual([]);
  });
});
