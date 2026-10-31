import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Keyboard } from './index.js';
import { bottomRow, cased, keys, shiftKey } from './layout.js';

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

  it('shows both characters of a key and types the shifted one after shift', async () => {
    const onKey = vi.fn();
    const withDigits = {
      ...layout,
      layers: {
        ...layout.layers,
        letters: [
          [shiftKey, ...keys('12', '!"'), ...cased('a')],
          ...layout.layers.letters.slice(1),
        ],
      },
    };
    render(<Keyboard layout={withDigits} onKey={onKey} />);
    const one = screen.getByRole('button', { name: '1' });
    expect(one).toHaveTextContent('!1');
    await userEvent.click(one);
    await userEvent.click(screen.getByRole('button', { name: 'Shift' }));
    await userEvent.click(screen.getByRole('button', { name: 'exclamation mark' }));
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    expect(onKey.mock.calls).toEqual([
      [{ type: 'text', value: '1' }],
      [{ type: 'text', value: '!' }],
      [{ type: 'text', value: '1' }],
    ]);
  });

  it('shows the icon and the name of a control key', () => {
    render(<Keyboard layout={layout} onKey={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Shift' })).toHaveTextContent('⇧Shift');
    expect(screen.getByRole('button', { name: 'Space' })).toHaveTextContent('␣space');
  });

  it('shows the AltGr character in the corner and types it after AltGr', async () => {
    const onKey = vi.fn();
    const withAltGr = {
      ...layout,
      layers: {
        letters: [[{ type: 'altgr' }, { type: 'text', value: 'e', shift: 'E', altgr: 'é' }]],
      },
    };
    render(<Keyboard layout={withAltGr} onKey={onKey} />);
    expect(screen.getByRole('button', { name: 'e' })).toHaveTextContent('eé');
    await userEvent.click(screen.getByRole('button', { name: 'AltGr' }));
    expect(screen.getByRole('button', { name: 'AltGr' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'é' }));
    expect(onKey).toHaveBeenCalledWith({ type: 'text', value: 'é' });
  });

  it('adds a number pad beside the keys, and turns it off with Num Lock', async () => {
    const onKey = vi.fn();
    render(<Keyboard layout={{ ...layout, decimal: ',' }} onKey={onKey} numpad />);
    const pad = screen.getByRole('group', { name: 'Number pad' });
    expect(within(pad).getAllByRole('button')).toHaveLength(17);
    await userEvent.click(within(pad).getByRole('button', { name: '7' }));
    await userEvent.click(within(pad).getByRole('button', { name: 'comma' }));
    expect(onKey.mock.calls.map(([key]) => key.value)).toEqual(['7', ',']);
    await userEvent.click(within(pad).getByRole('button', { name: 'Num lock' }));
    expect(within(pad).getByRole('button', { name: '7' })).toBeDisabled();
    expect(within(pad).getByRole('button', { name: 'plus' })).toBeEnabled();
  });

  it('has no number pad unless asked for', () => {
    render(<Keyboard layout={layout} onKey={vi.fn()} />);
    expect(screen.queryByRole('group', { name: 'Number pad' })).not.toBeInTheDocument();
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
    expect(screen.getByRole('group').style.getPropertyValue('--saccade-key')).toBe('');
  });

  it('uses the device font unless told otherwise', () => {
    render(<Keyboard layout={layout} onKey={vi.fn()} />);
    expect(screen.getByRole('group').style.fontFamily).toContain('system-ui');
  });

  it.each([
    ['mono', 'monospace'],
    ['serif', 'serif'],
    ['"Atkinson Hyperlegible", sans-serif', 'Atkinson Hyperlegible'],
  ])('takes the %s font', (font, expected) => {
    render(<Keyboard layout={layout} onKey={vi.fn()} font={font} />);
    expect(screen.getByRole('group').style.fontFamily).toContain(expected);
  });

  it.each(['light', 'dark'])('has no accessibility violations in the %s theme', async (theme) => {
    const { container } = render(<Keyboard layout={layout} onKey={vi.fn()} theme={theme} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
