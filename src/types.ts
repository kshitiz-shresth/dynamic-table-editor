import type { CSSProperties } from 'react';

export interface DynamicTableProps {
  /** Controlled HTML value. The editor outputs an HTML string on every change. */
  value?: string;
  /** Initial HTML (uncontrolled). Ignored when `value` is supplied. */
  defaultValue?: string;
  onChange?: (html: string) => void;
  /** Number of initial columns (used only if no value/defaultValue is provided). */
  cols?: number;
  /** Number of initial data rows, excluding the header (used only on first render). */
  rows?: number;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
}
