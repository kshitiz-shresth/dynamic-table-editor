import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DragState {
  type: 'row' | 'col';
  from: number;
  over: number | null;
}

/**
 * Tracks the geometry of every row and column in the rendered TipTap table
 * and provides handlers to move them around by rewriting the editor's HTML.
 *
 * Header row (index 0) is intentionally non-draggable so it stays fixed at the top.
 */
export function useTableReorder(editor: Editor | null, enabled: boolean) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rowRects, setRowRects] = useState<Rect[]>([]);
  const [colRects, setColRects] = useState<Rect[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);

  // ── Measure rows + cols ──────────────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !editor || !enabled) {
      setRowRects([]);
      setColRects([]);
      return;
    }

    let frame = 0;
    let mo: MutationObserver | null = null;
    let ro: ResizeObserver | null = null;
    let watchedTable: HTMLTableElement | null = null;
    // Skip measurement while TipTap's column-resize is in progress. Each
    // mousemove during a resize fires DOM mutations on <col> styles; if we
    // re-measure → setState → re-render on every one, React's reconciliation
    // races with ProseMirror's resize-preview decoration and the column
    // visibly snaps back and forth between widths.
    let isResizing = false;

    const rectsEqual = (a: Rect[], b: Rect[]) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i].x !== b[i].x || a[i].y !== b[i].y || a[i].w !== b[i].w || a[i].h !== b[i].h) {
          return false;
        }
      }
      return true;
    };

    const isResizeCursorActive = () =>
      !!wrapper.querySelector('.tiptap.resize-cursor');

    const measure = () => {
      if (isResizing || isResizeCursorActive()) return;

      const wrapRect = wrapper.getBoundingClientRect();
      const offsetX = -wrapRect.x + wrapper.scrollLeft;
      const offsetY = -wrapRect.y + wrapper.scrollTop;

      const trs = wrapper.querySelectorAll('table > tbody > tr');
      const firstRowCells = wrapper.querySelectorAll(
        'table > tbody > tr:first-child > th, table > tbody > tr:first-child > td'
      );

      const rRects: Rect[] = Array.from(trs).map((tr) => {
        const r = (tr as HTMLElement).getBoundingClientRect();
        return { x: r.x + offsetX, y: r.y + offsetY, w: r.width, h: r.height };
      });
      const cRects: Rect[] = Array.from(firstRowCells).map((th) => {
        const r = (th as HTMLElement).getBoundingClientRect();
        return { x: r.x + offsetX, y: r.y + offsetY, w: r.width, h: r.height };
      });

      setRowRects((prev) => (rectsEqual(prev, rRects) ? prev : rRects));
      setColRects((prev) => (rectsEqual(prev, cRects) ? prev : cRects));
    };

    const scheduleMeasure = () => {
      if (isResizing || isResizeCursorActive()) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    // Observe ONLY the <table>, not the wrapper — otherwise the drag handles
    // we render inside the wrapper would trigger their own mutations and loop.
    const attachTableObservers = () => {
      const table = wrapper.querySelector('table') as HTMLTableElement | null;
      if (!table || table === watchedTable) return;
      mo?.disconnect();
      ro?.disconnect();
      watchedTable = table;
      mo = new MutationObserver(scheduleMeasure);
      mo.observe(table, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'colspan', 'rowspan', 'colwidth', 'data-colwidth'],
      });
      ro = new ResizeObserver(scheduleMeasure);
      ro.observe(table);
    };

    attachTableObservers();
    scheduleMeasure();

    // setContent replaces the <table>, so re-attach observers on every update
    const onUpdate = () => {
      attachTableObservers();
      scheduleMeasure();
    };
    editor.on('update', onUpdate);

    wrapper.addEventListener('scroll', scheduleMeasure);
    window.addEventListener('resize', scheduleMeasure);

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest('.column-resize-handle')) {
        isResizing = true;
      }
    };

    const onPointerUp = () => {
      if (!isResizing) return;
      isResizing = false;
      scheduleMeasure();
    };

    wrapper.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointercancel', onPointerUp, true);

    return () => {
      cancelAnimationFrame(frame);
      mo?.disconnect();
      ro?.disconnect();
      editor.off('update', onUpdate);
      wrapper.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      wrapper.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerUp, true);
    };
  }, [editor, enabled]);

  // ── Move row ─────────────────────────────────────────────────────────
  const moveRow = useCallback(
    (from: number, to: number) => {
      if (!editor || from === to || from === 0 || to === 0) return;
      const html = editor.getHTML();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const tbody = doc.querySelector('tbody');
      if (!tbody) return;
      const rows = Array.from(tbody.children);
      if (from < 0 || to < 0 || from >= rows.length || to >= rows.length) return;
      const [moved] = rows.splice(from, 1);
      rows.splice(to, 0, moved);
      tbody.replaceChildren(...rows);
      const out = doc.querySelector('table')?.outerHTML;
      if (out) editor.commands.setContent(out, { emitUpdate: true });
    },
    [editor]
  );

  // ── Move column ──────────────────────────────────────────────────────
  const moveColumn = useCallback(
    (from: number, to: number) => {
      if (!editor || from === to) return;
      const html = editor.getHTML();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Reorder colgroup if present
      const colgroup = doc.querySelector('colgroup');
      if (colgroup) {
        const cols = Array.from(colgroup.children);
        if (from < cols.length && to < cols.length) {
          const [m] = cols.splice(from, 1);
          cols.splice(to, 0, m);
          colgroup.replaceChildren(...cols);
        }
      }

      // Reorder cells in every row. Rows whose cell at `from` has been merged
      // into a previous cell may have fewer children — guard for that.
      const rows = Array.from(doc.querySelectorAll('tbody > tr'));
      rows.forEach((row) => {
        const cells = Array.from(row.children);
        if (from < cells.length && to < cells.length) {
          const [m] = cells.splice(from, 1);
          cells.splice(to, 0, m);
          row.replaceChildren(...cells);
        }
      });

      const out = doc.querySelector('table')?.outerHTML;
      if (out) editor.commands.setContent(out, { emitUpdate: true });
    },
    [editor]
  );

  // Cleanup drag state on global mouseup (in case drop fires outside a target)
  useEffect(() => {
    const stop = () => setDrag(null);
    window.addEventListener('dragend', stop);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragend', stop);
      window.removeEventListener('drop', stop);
    };
  }, []);

  return {
    wrapperRef,
    rowRects,
    colRects,
    drag,
    setDrag,
    moveRow,
    moveColumn,
  };
}
