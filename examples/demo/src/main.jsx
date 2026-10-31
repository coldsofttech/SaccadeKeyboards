import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Keyboard } from '@coldsofttech/saccade-keyboards';
import { applyKey } from '@coldsofttech/saccade-keyboards/core';
import '@coldsofttech/saccade-keyboards/style.css';
import { createLayout as createEnglish } from '@coldsofttech/saccade-en';
import { createLayout as createSpanish } from '@coldsofttech/saccade-es';
import { createLayout as createFrench } from '@coldsofttech/saccade-fr';
import { createLayout as createHindi } from '@coldsofttech/saccade-hi';
import { createLayout as createTelugu } from '@coldsofttech/saccade-te';
import { createLayout as createUrdu } from '@coldsofttech/saccade-ur';

const LAYOUTS = new Map([
  ['English', createEnglish],
  ['Spanish', createSpanish],
  ['French', createFrench],
  // Hindi has no regions: the keyboard is InScript or phonetic and the region picks the digits.
  ['Hindi', createHindi],
  ['Telugu', createTelugu],
  ['Urdu', createUrdu],
]);
const LANGUAGES = [...LAYOUTS.keys()];
const REGIONS = new Map([
  ['English', ['US', 'GB', 'AU', 'CA', 'IN']],
  ['Spanish', ['ES', 'MX', 'AR', 'CO', 'US', 'LATAM']],
  ['French', ['FR', 'BE', 'CA', 'CH']],
  ['Hindi', ['latin', 'devanagari']],
  ['Telugu', ['latin', 'telugu']],
  ['Urdu', ['latin', 'urdu']],
]);
// `native` is the order of the keyboard of the region: QWERTY, AZERTY and so on.
const ARRANGEMENTS = ['native', 'alphabetical'];
const HINDI_ARRANGEMENTS = ['inscript', 'phonetic'];
const THEMES = ['light', 'dark'];
const FONTS = ['native', 'sans', 'serif', 'mono'];
// The keyboard fills the element it sits in, so the demo sets its width on a wrapper.
const WIDTHS = ['full', '430 px', '600 px', '800 px', '1000 px'];

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
  const [chosenRegion, setRegion] = useState('US');
  const [arrangement, setArrangement] = useState('native');
  const [theme, setTheme] = useState('light');
  const [font, setFont] = useState('native');
  const [fontSize, setFontSize] = useState(20);
  const [width, setWidth] = useState('full');
  const [shown, setShown] = useState(true);
  const [numpad, setNumpad] = useState(false);
  const [currencypad, setCurrencypad] = useState(false);

  // A region from the other language falls back to that language's first one.
  const arrangements = ['Hindi', 'Telugu'].includes(language) ? HINDI_ARRANGEMENTS : ARRANGEMENTS;
  const letters = arrangements.includes(arrangement) ? arrangement : arrangements[0];
  const regions = REGIONS.get(language);
  const region = regions.includes(chosenRegion) ? chosenRegion : regions[0];

  const onKey = (key) => {
    const { value, selectionStart, selectionEnd } = field.current;
    const next = applyKey(value, { start: selectionStart, end: selectionEnd }, key);
    field.current.value = next.text;
    field.current.setSelectionRange(next.selection.start, next.selection.end);
  };

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1>{language} keyboard</h1>
      <p>Click in the field, then press keys on the on-screen keyboard.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <Select label="Language" value={language} options={LANGUAGES} onChange={setLanguage} />
        <Select label="Letters" value={letters} options={arrangements} onChange={setArrangement} />
        <Select label="Region" value={region} options={regions} onChange={setRegion} />
        <Select label="Theme" value={theme} options={THEMES} onChange={setTheme} />
        <Select label="Font" value={font} options={FONTS} onChange={setFont} />
        <Select label="Width" value={width} options={WIDTHS} onChange={setWidth} />
        <label>
          <input type="checkbox" checked={numpad} onChange={(e) => setNumpad(e.target.checked)} />{' '}
          Number pad
        </label>
        <label>
          <input
            type="checkbox"
            checked={currencypad}
            onChange={(e) => setCurrencypad(e.target.checked)}
          />{' '}
          Currency pad
        </label>
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
        <div
          style={{
            width: width === 'full' ? undefined : Number.parseInt(width, 10),
            maxWidth: '100%',
            overflowX: 'auto',
          }}
        >
          <Keyboard
            layout={LAYOUTS.get(language)(letters === 'native' ? undefined : letters, region)}
            onKey={onKey}
            onClose={() => setShown(false)}
            theme={theme}
            font={font}
            fontSize={fontSize}
            numpad={numpad}
            currencypad={currencypad}
          />
        </div>
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
