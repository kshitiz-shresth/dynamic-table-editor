import { Extension } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';

/**
 * Document schema constrained to a single table — the document MUST contain
 * exactly one table and nothing else. Prevents users from typing paragraphs
 * outside the table or deleting the table entirely.
 */
export const TableOnlyDocument = Document.extend({
  content: 'table',
});

/**
 * Overrides Cmd/Ctrl-A so that selection is limited to the current cell's
 * text instead of the whole document. Without this, the default ProseMirror
 * `selectAll` selects from doc start to doc end which (a) crosses cells and
 * (b) lets a follow-up Delete blank the editor.
 */
export const SelectCurrentCell = Extension.create({
  name: 'selectCurrentCell',

  addKeyboardShortcuts() {
    return {
      'Mod-a': ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;

        // Walk up the tree to find the enclosing cell node.
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          const name = node.type.name;
          if (name === 'tableCell' || name === 'tableHeader') {
            // Select just the contents of the cell (skip the cell's own
            // open/close tokens by going one level inside).
            const start = $from.start(depth) + 1;
            const end = $from.end(depth) - 1;
            if (end > start) {
              editor.commands.setTextSelection({ from: start, to: end });
            } else {
              editor.commands.setTextSelection(start);
            }
            return true;
          }
        }
        // Outside any cell — fall back to default selectAll behavior
        return false;
      },
    };
  },
});
