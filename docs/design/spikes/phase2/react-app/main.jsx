import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Keyboard, useKeyboard } from '@coldsofttech/saccade-keyboards';
import { applyKey } from '@coldsofttech/saccade-keyboards/core';
import '@coldsofttech/saccade-keyboards/style.css';
import { layout } from '@coldsofttech/saccade-en';

function type(key) {
  const field = document.getElementById('field');
  const result = applyKey(
    field.value,
    { start: field.selectionStart, end: field.selectionEnd },
    key,
  );
  field.value = result.text;
  field.setSelectionRange(result.selection.start, result.selection.end);
}

/** A keyboard the app draws itself, from the hook: a row of three letters. */
function Mini() {
  const { rows, press, describe } = useKeyboard({ layout, onKey: () => {} });
  return (
    <div id="mini">
      {rows[1].slice(0, 3).map((key, i) => (
        <button key={i} type="button" onClick={() => press(key)}>
          {describe(key).label}
        </button>
      ))}
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState('light');
  return (
    <>
      <button id="theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        theme
      </button>
      <Keyboard layout={layout} onKey={type} theme={theme} numpad />
      <Mini />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
