import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Keyboard, languages, registerLanguage } from './index.js';

const layout = {
  id: 'en',
  name: 'Test',
  dir: 'ltr',
  layers: { letters: [[{ type: 'text', value: 'a' }]] },
};

describe('Keyboard by language', () => {
  it('loads the layout of a registered language', async () => {
    registerLanguage('xx', async () => ({ layout }));
    const onKey = vi.fn();
    const { container } = render(<Keyboard language="xx" onKey={onKey} />);
    await userEvent.click(await screen.findByRole('button', { name: 'a' }));
    expect(onKey).toHaveBeenCalledWith({ type: 'text', value: 'a' });
    expect(languages()).toContain('xx');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the fallback while the layout loads', async () => {
    registerLanguage('slow', () => new Promise(() => {}));
    render(<Keyboard language="slow" onKey={vi.fn()} fallback={<p>Loading</p>} />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('says which package to install for an unknown language', async () => {
    render(<Keyboard language="zz" onKey={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('@coldsofttech/saccade-zz');
  });

  it('refuses a layout that is not valid', async () => {
    registerLanguage('bad', async () => ({ id: 'bad' }));
    render(<Keyboard language="bad" onKey={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('not a valid layout');
  });

  it('uses a layout passed directly', () => {
    render(<Keyboard layout={layout} onKey={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'a' })).toBeInTheDocument();
  });
});
