import React, { useState } from 'react';
import { DynamicTable } from '../components/DynamicTable';

export function App() {
  const [html, setHtml] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Project Task Tracker</h1>
        <p style={styles.sub}>
          Click any cell to edit. <strong>Drag a column border</strong> to resize.
          Select a range of cells (click + drag) then click <strong>Merge cells</strong>.
          Right-click for more options. The header row is protected from deletion.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Project Name</label>
            <input style={styles.input} placeholder="e.g. Website Redesign" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Task Table</label>
            <DynamicTable
              cols={4}
              rows={4}
              onChange={setHtml}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Notes</label>
            <textarea
              style={{ ...styles.input, height: 80, resize: 'vertical' }}
              placeholder="Any additional notes..."
            />
          </div>

          <div style={styles.actions}>
            <button type="submit" style={styles.btn}>
              {submitted ? '✓ Saved!' : 'Save form'}
            </button>
          </div>
        </form>

        <details style={styles.debug}>
          <summary style={styles.debugSummary}>View HTML output</summary>
          <pre style={styles.pre}>{html || '(no changes yet)'}</pre>
        </details>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '36px 40px',
    width: '100%',
    maxWidth: 900,
    alignSelf: 'flex-start',
  },
  heading: { margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#0f172a' },
  sub: { margin: '0 0 28px', fontSize: 13, color: '#64748b', lineHeight: 1.6 },
  field: { marginBottom: 24 },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
    letterSpacing: '0.02em',
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 7,
    fontSize: 13,
    color: '#1e293b',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fafafa',
    fontFamily: 'inherit',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', paddingTop: 8 },
  btn: {
    padding: '10px 28px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  debug: { marginTop: 32, borderTop: '1px solid #f1f5f9', paddingTop: 16 },
  debugSummary: { fontSize: 12, color: '#94a3b8', cursor: 'pointer' },
  pre: {
    marginTop: 12,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: 14,
    fontSize: 11,
    color: '#334155',
    overflow: 'auto',
    maxHeight: 340,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
};
