# Dynamic Table Editor

A React + TipTap powered dynamic table editor with:

- Column resize
- Row/column reorder via drag handles
- Add/delete rows and columns
- Merge/split cells
- Header row protection
- Read-only mode

## Demo Features

- Click any cell to edit
- Drag a column border to resize
- Select a cell range and merge
- Reorder rows/columns using drag handles

## Installation

```bash
npm install dynamic-table-editor
```

## Usage

```tsx
import React, { useState } from 'react';
import { DynamicTable } from 'dynamic-table-editor';

export default function Example() {
  const [html, setHtml] = useState('');

  return (
    <DynamicTable
      cols={4}
      rows={4}
      value={html}
      onChange={setHtml}
    />
  );
}
```

## Using `defaultValue`

Use `defaultValue` when you already have saved table HTML and want to prefill the editor once.

```tsx
import { DynamicTable } from 'dynamic-table-editor';

const savedHtml = `
<table>
  <tbody>
    <tr><th><p>Task</p></th><th><p>Owner</p></th></tr>
    <tr><td><p>Design</p></td><td><p>Kshitiz</p></td></tr>
  </tbody>
</table>
`;

<DynamicTable defaultValue={savedHtml} onChange={(html) => console.log(html)} />;
```

Notes:
- `defaultValue` is for uncontrolled initial content (first render only)
- If you need live external control (API fetch, reset, edit existing record), use `value` + `onChange`

## Using Inside a Form

`DynamicTable` works well as a form field because it outputs an HTML string through `onChange`.

```tsx
import React, { useState } from 'react';
import { DynamicTable } from 'dynamic-table-editor';

export default function TaskForm() {
  const [form, setForm] = useState({
    title: '',
    tableHtml: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // send form.tableHtml to your API
    console.log(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.title}
        onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
        placeholder="Project title"
      />

      <DynamicTable
        cols={4}
        rows={4}
        value={form.tableHtml}
        onChange={(html) => setForm((s) => ({ ...s, tableHtml: html }))}
      />

      <button type="submit">Save</button>
    </form>
  );
}
```

## Props

- `value?: string` Controlled HTML value
- `defaultValue?: string` Initial HTML for uncontrolled usage
- `onChange?: (html: string) => void` Fires on each update
- `cols?: number` Initial column count (default: `3`)
- `rows?: number` Initial data row count (default: `3`)
- `readOnly?: boolean` Disable editing interactions
- `className?: string` Custom root class
- `style?: React.CSSProperties` Inline root styles

## Local Development

```bash
npm install
npm run dev
```

App runs at:

- `http://localhost:5173/`

## Build

```bash
npm run build
```

## Package Release

```bash
npm version patch   # or minor / major
npm publish
```

## License

MIT
