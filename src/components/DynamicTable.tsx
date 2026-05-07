import React, { useEffect, useRef } from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';

import { DynamicTableProps } from '../types';
import { makeTableHTML } from '../utils';
import { useTableReorder } from '../hooks/useTableReorder';
import { TableOnlyDocument, SelectCurrentCell } from '../extensions';
import './DynamicTable.css';

export function DynamicTable({
  value,
  defaultValue,
  onChange,
  cols = 3,
  rows = 3,
  readOnly = false,
  className = '',
  style,
}: DynamicTableProps) {
  const initialContent = value ?? defaultValue ?? makeTableHTML(cols, rows);

  const editor = useEditor({
    extensions: [
      // Replace StarterKit's Document with our table-only Document.
      TableOnlyDocument,
      StarterKit.configure({
        document: false, // we provide our own
        // Disable block types that don't make sense inside table cells
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
        cellMinWidth: 120,
        allowTableNodeSelection: false, // can't select the table as a whole
      }),
      TableRow,
      TableHeader,
      TableCell,
      SelectCurrentCell,
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  // Sync readOnly changes
  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  // Sync controlled value from outside (only when it differs from internal HTML)
  const lastEmittedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!editor || value === undefined) return;
    if (value === lastEmittedRef.current) return; // our own change, skip
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  // Capture HTML we emitted so we can ignore echo-backs from the parent
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      lastEmittedRef.current = editor.getHTML();
    };
    editor.on('update', handler);
    return () => editor.off('update', handler);
  }, [editor]);

  // Re-derive toolbar state on every cursor/selection change
  const toolbarState = useEditorState({
    editor,
    selector: (ctx) => {
      const e = ctx.editor;
      if (!e) return { inHeader: false, canMerge: false, canSplit: false, canDelCol: false, canDelRow: false };
      const inHeader = e.isActive('tableHeader');
      return {
        inHeader,
        canMerge: e.can().mergeCells(),
        canSplit: e.can().splitCell(),
        canDelCol: e.can().deleteColumn(),
        canDelRow: e.can().deleteRow() && !inHeader,
      };
    },
  });

  // Drag-to-reorder rows and columns
  const {
    wrapperRef,
    rowRects,
    colRects,
    drag,
    setDrag,
    moveRow,
    moveColumn,
  } = useTableReorder(editor, !readOnly);

  if (!editor) return null;

  const { inHeader, canMerge, canSplit, canDelCol, canDelRow } = toolbarState ?? {
    inHeader: false, canMerge: false, canSplit: false, canDelCol: false, canDelRow: false,
  };

  return (
    <div
      className={`dte-root${readOnly ? ' dte-root--readonly' : ''}${className ? ' ' + className : ''}`}
      style={style}
    >
      {/* ── Toolbar ── */}
      {!readOnly && (
        <div className="dte-toolbar">
          {/* Row operations */}
          <button
            className="dte-btn"
            title="Insert row above"
            onClick={() => editor.chain().focus().addRowBefore().run()}
          >
            ↑ Row above
          </button>
          <button
            className="dte-btn"
            title="Insert row below"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            ↓ Row below
          </button>
          <button
            className="dte-btn dte-btn--danger"
            title={inHeader ? 'Cannot delete the header row' : 'Delete current row'}
            disabled={!canDelRow}
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            ✕ Row
          </button>

          <div className="dte-sep" />

          {/* Column operations */}
          <button
            className="dte-btn"
            title="Insert column before"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          >
            ← Col before
          </button>
          <button
            className="dte-btn"
            title="Insert column after"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            → Col after
          </button>
          <button
            className="dte-btn dte-btn--danger"
            title="Delete current column"
            disabled={!canDelCol}
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            ✕ Col
          </button>

          <div className="dte-sep" />

          {/* Merge / split */}
          <button
            className="dte-btn dte-btn--primary"
            title="Select multiple cells then merge"
            disabled={!canMerge}
            onClick={() => editor.chain().focus().mergeCells().run()}
          >
            ⊞ Merge cells
          </button>
          <button
            className="dte-btn"
            title="Split the current merged cell"
            disabled={!canSplit}
            onClick={() => editor.chain().focus().splitCell().run()}
          >
            ⊟ Split cell
          </button>
        </div>
      )}

      {/* ── Editor + drag overlays ── */}
      <div className="dte-editor-wrap">
        <div className="dte-editor-scroll" ref={wrapperRef}>
          <div className="dte-editor">
            <EditorContent editor={editor} />
          </div>

          {/* ── Row drag handles (skip header at index 0) ── */}
          {!readOnly &&
            rowRects.slice(1).map((rect, i) => {
              const idx = i + 1;
              const isDragging = drag?.type === 'row' && drag.from === idx;
              const isOver = drag?.type === 'row' && drag.over === idx && drag.from !== idx;
              return (
                <div
                  key={`rh-${idx}`}
                  className={
                    'dte-row-handle' +
                    (isDragging ? ' dte-row-handle--dragging' : '') +
                    (isOver ? ' dte-row-handle--target' : '')
                  }
                  style={{ top: rect.y, height: rect.h, left: rect.x - 18 }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/dte-row', String(idx));
                    e.dataTransfer.effectAllowed = 'move';
                    setDrag({ type: 'row', from: idx, over: null });
                  }}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes('text/dte-row')) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDrag((s) => (s ? { ...s, over: idx } : null));
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = Number(e.dataTransfer.getData('text/dte-row'));
                    moveRow(from, idx);
                    setDrag(null);
                  }}
                  onDragEnd={() => setDrag(null)}
                  title="Drag to reorder row"
                >
                  <span>⋮⋮</span>
                </div>
              );
            })}

          {/* ── Column drag handles (above header cells) ── */}
          {!readOnly &&
            colRects.map((rect, i) => {
              const isDragging = drag?.type === 'col' && drag.from === i;
              const isOver = drag?.type === 'col' && drag.over === i && drag.from !== i;
              return (
                <div
                  key={`ch-${i}`}
                  className={
                    'dte-col-handle' +
                    (isDragging ? ' dte-col-handle--dragging' : '') +
                    (isOver ? ' dte-col-handle--target' : '')
                  }
                  style={{ left: rect.x, width: rect.w, top: rect.y - 18 }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/dte-col', String(i));
                    e.dataTransfer.effectAllowed = 'move';
                    setDrag({ type: 'col', from: i, over: null });
                  }}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes('text/dte-col')) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDrag((s) => (s ? { ...s, over: i } : null));
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = Number(e.dataTransfer.getData('text/dte-col'));
                    moveColumn(from, i);
                    setDrag(null);
                  }}
                  onDragEnd={() => setDrag(null)}
                  title="Drag to reorder column"
                >
                  <span>⋯</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
