/** Default width for each new column in pixels. */
export const DEFAULT_COL_WIDTH = 160;

/** Build the initial table HTML that TipTap will parse. */
export function makeTableHTML(cols = 3, rows = 3, colWidth = DEFAULT_COL_WIDTH): string {
  const header = Array.from(
    { length: cols },
    (_, i) => `<th colwidth="${colWidth}"><p>Column ${i + 1}</p></th>`
  ).join('');

  const dataRow = Array.from(
    { length: cols },
    () => `<td colwidth="${colWidth}"><p></p></td>`
  ).join('');

  const dataRows = Array.from({ length: rows }, () => `<tr>${dataRow}</tr>`).join('');

  return `<table><tbody><tr>${header}</tr>${dataRows}</tbody></table>`;
}
