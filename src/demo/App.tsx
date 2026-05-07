import React, { useState } from 'react';
import { DynamicTable } from '../components/DynamicTable';

export function App() {
  const [html, setHtml] = useState<string>('');

  return (
    <div style={styles.page}>
      <DynamicTable cols={4} rows={4} onChange={setHtml} />
      <details style={styles.debug}>
        <summary style={styles.debugSummary}>View HTML output</summary>
        <pre style={styles.pre}>{html || '(no changes yet)'}</pre>
      </details>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  debug: { marginTop: 16 },
  debugSummary: { fontSize: 12, color: '#64748b', cursor: 'pointer' },
  pre: {
    marginTop: 8,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: 12,
    fontSize: 11,
    color: '#334155',
    overflow: 'auto',
    maxHeight: 280,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
};
