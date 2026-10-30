import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Keyboard } from './index.js';
import { bottomRow, cased, shiftKey } from './layout.js';

const layout = {
  id: 'en',
  name: 'Test',
  dir: 'ltr',
  layers: {
    letters: [
      [shiftKey, ...cased('ab')],
      bottomRow({ type: 'layer', to: 'symbols', label: '?123', name: 'Numbers' }),
    ],
    symbols: [[{ type: 'text', value: '1' }]],
  },
};

describe('Keyboard', () => {
  it('reports the key that was pressed', async () => {
    const onKey = vi.fn();
    render(<Keyboard layout={layout} onKey={onKey} />);
    await userEvent.click(screen.getByRole('button', { name: 'a' }));
    expect(onKey).toHaveBeenCalledWith({ type: 'text', value: 'a' });
  });

  it('types capitals after shift and shows that it is on', async () => {
    const onKey = vi.fn();
    render(<Keyboard layout={layout} onKey={onKey} />);
    await userEvent.click(screen.getByRole('button', { name: 'Shift' }));
    expect(screen.getByRole('button', { name: 'Shift' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(onKey).toHaveBeenCalledWith({ type: 'text', value: 'A' });
  });

  it('shows another layer', async () => {
    render(<Keyboard layout={layout} onKey={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Numbers' }));
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  });

  it('keeps the focus in the field being typed into', async () => {
    render(
      <>
        <input aria-label="Field" />
        <Keyboard layout={layout} onKey={vi.fn()} />
      </>,
    );
    await userEvent.click(screen.getByLabelText('Field'));
    await userEvent.click(screen.getByRole('button', { name: 'a' }));
    expect(screen.getByLabelText('Field')).toHaveFocus();
  });

  it('is named after the layout and takes its language', () => {
    render(<Keyboard layout={layout} onKey={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Test on-screen keyboard' })).toHaveAttribute(
      'lang',
      'en',
    );
  });

  it('takes colours from a theme object', () => {
    render(<Keyboard layout={layout} onKey={vi.fn()} theme={{ accent: 'red', nope: 'blue' }} />);
    expect(screen.getByRole('group').style.getPropertyValue('--saccade-accent')).toBe('red');
    expect(screen.getByRole('group').style.length).toBe(1);
  });

  it.each(['light', 'dark'])('has no accessibility violations in the %s theme', async (theme) => {
    const { container } = render(<Keyboard layout={layout} onKey={vi.fn()} theme={theme} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
