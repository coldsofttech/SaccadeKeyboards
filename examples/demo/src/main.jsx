import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Keyboard } from '@coldsofttech/saccade-keyboards';
import { applyKey } from '@coldsofttech/saccade-keyboards/core';
import '@coldsofttech/saccade-keyboards/style.css';
import { createLayout as createEnglish } from '@coldsofttech/saccade-en';
import { createLayout as createSpanish } from '@coldsofttech/saccade-es';

const LAYOUTS = new Map([
  ['English', createEnglish],
  ['Spanish', createSpanish],
]);
const LANGUAGES = [...LAYOUTS.keys()];
const ARRANGEMENTS = ['qwerty', 'alphabetical'];
const THEMES = ['light', 'dark'];
const FONTS = ['native', 'sans', 'serif', 'mono'];

function Select({ label, value, options, onChange }) {
  return (
    <label>
      {label}{' '}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Demo() {
  const field = useRef(null);
  const [language, setLanguage] = useState('English');
  const [arrangement, setArrangement] = useState('qwerty');
  const [theme, setTheme] = useState('light');
  const [font, setFont] = useState('native');
  const [fontSize, setFontSize] = useState(20);
  const [shown, setShown] = useState(true);

  const onKey = (key) => {
    const { value, selectionStart, selectionEnd } = field.current;
    const next = applyKey(value, { start: selectionStart, end: selectionEnd }, key);
    field.current.value = next.text;
    field.current.setSelectionRange(next.selection.start, next.selection.end);
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1>{language} keyboard</h1>
      <p>Click in the field, then press keys on the on-screen keyboard.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <Select label="Language" value={language} options={LANGUAGES} onChange={setLanguage} />
        <Select
          label="Letters"
          value={arrangement}
          options={ARRANGEMENTS}
          onChange={setArrangement}
        />
        <Select label="Theme" value={theme} options={THEMES} onChange={setTheme} />
        <Select label="Font" value={font} options={FONTS} onChange={setFont} />
        <label>
          Key size{' '}
          <input
            type="number"
            min={12}
            max={40}
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value) || 16)}
          />
        </label>
      </div>
      <textarea
        ref={field}
        aria-label="Message"
        rows={5}
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: 16, fontSize: 18 }}
        onFocus={() => setShown(true)}
      />
      {shown ? (
        <Keyboard
          layout={LAYOUTS.get(language)(arrangement)}
          onKey={onKey}
          onClose={() => setShown(false)}
          theme={theme}
          font={font}
          fontSize={fontSize}
        />
      ) : (
        <button type="button" onClick={() => setShown(true)}>
          Show keyboard
        </button>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
