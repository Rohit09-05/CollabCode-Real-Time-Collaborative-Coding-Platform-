import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const MONACO_LANG_MAP = {
  javascript: 'javascript', typescript: 'typescript', python: 'python',
  java: 'java', cpp: 'cpp', c: 'c', go: 'go', rust: 'rust',
  ruby: 'ruby', php: 'php',
};

/**
 * Collaborative Monaco editor backed by a Yjs Y.Text CRDT.
 *
 * Architecture:
 * - Each file gets its own Y.Doc + Y.Text instance (keyed by file.id).
 * - When a local change happens, MonacoBinding updates Y.Text automatically.
 * - We listen to Y.Text 'update' events, serialize the delta, and send it via socket.
 * - When a remote code_update arrives (via registerCodeHandler), we apply the
 *   Yjs binary update to the local Y.Doc, merging concurrent edits without conflict.
 */
export default function CollabEditor({
  file, roomCode, role, user, cursors,
  registerCodeHandler, sendCodeChange, sendCursorMove,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const bindingRef = useRef(null);
  const decorationsRef = useRef([]);
  const isApplyingRemote = useRef(false);

  const { theme } = useTheme();
  const language = MONACO_LANG_MAP[file.language] || 'javascript';
  const isReadOnly = role === 'viewer';

  // ── Editor mount ────────────────────────────────────────────────────────────
  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Create Yjs doc for this file
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('content');
    ydocRef.current = ydoc;
    ytextRef.current = ytext;

    // Seed the Yjs text with the file's current content
    if (file.content && ytext.toString() === '') {
      ydoc.transact(() => ytext.insert(0, file.content));
    }

    // Bind Yjs text to Monaco model
    const binding = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      null // no awareness provider — we handle cursors ourselves via sockets
    );
    bindingRef.current = binding;

    // Broadcast Yjs updates when local changes occur
    ydoc.on('update', (update, origin) => {
      if (origin === 'remote') return; // don't echo back
      const delta = btoa(String.fromCharCode(...update));
      const content = ytext.toString();
      sendCodeChange(file.id, delta, ydoc.clientID, content);
    });

    // Cursor position tracking
    editor.onDidChangeCursorPosition(({ position }) => {
      sendCursorMove(file.id, { lineNumber: position.lineNumber, column: position.column }, null);
    });

    editor.onDidChangeCursorSelection(({ selection }) => {
      sendCursorMove(file.id, null, {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn,
      });
    });
  }, [file.id, file.content, sendCodeChange, sendCursorMove]);

  // ── Register remote update handler ─────────────────────────────────────────
  useEffect(() => {
    const unregister = registerCodeHandler(file.id, ({ delta }) => {
      const ydoc = ydocRef.current;
      if (!ydoc || !delta) return;
      try {
        const binary = Uint8Array.from(atob(delta), (c) => c.charCodeAt(0));
        isApplyingRemote.current = true;
        Y.applyUpdate(ydoc, binary, 'remote');
        isApplyingRemote.current = false;
      } catch (err) {
        console.warn('Failed to apply Yjs update:', err);
      }
    });
    return unregister;
  }, [file.id, registerCodeHandler]);

  // ── Remote cursor decorations ───────────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations = Object.entries(cursors)
      .filter(([, c]) => c.fileId === file.id)
      .flatMap(([userId, cursor]) => {
        const decorations = [];
        const color = cursor.avatarColor || '#60A5FA';

        if (cursor.selection) {
          const { startLineNumber, startColumn, endLineNumber, endColumn } = cursor.selection;
          if (startLineNumber !== endLineNumber || startColumn !== endColumn) {
            decorations.push({
              range: new monaco.Range(startLineNumber, startColumn, endLineNumber, endColumn),
              options: {
                className: `remote-selection-${userId.slice(-6)}`,
                inlineClassName: undefined,
                stickiness: 1,
              },
            });
          }
        }

        if (cursor.position) {
          const { lineNumber, column } = cursor.position;
          decorations.push({
            range: new monaco.Range(lineNumber, column, lineNumber, column + 1),
            options: {
              className: `remote-cursor-${userId.slice(-6)}`,
              beforeContentClassName: `remote-cursor-caret-${userId.slice(-6)}`,
              stickiness: 1,
              zIndex: 10,
              after: {
                content: ` ${cursor.username} `,
                inlineClassName: 'remote-cursor-label',
              },
            },
          });
        }

        return decorations;
      });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [cursors, file.id]);

  // Inject cursor CSS for each remote user
  useEffect(() => {
    const styleId = 'remote-cursor-styles';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    const rules = Object.entries(cursors)
      .filter(([, c]) => c.avatarColor)
      .map(([userId, c]) => {
        const id = userId.slice(-6);
        const color = c.avatarColor;
        return `
          .remote-cursor-caret-${id}::before {
            content: '';
            border-left: 2px solid ${color};
            height: 1.2em;
            position: absolute;
            margin-left: -1px;
          }
          .remote-selection-${id} {
            background: ${color}33;
          }
          .remote-cursor-label {
            background: ${color};
            color: white;
            font-size: 10px;
            padding: 0 2px;
            border-radius: 2px;
            opacity: 0.9;
            pointer-events: none;
          }
        `;
      }).join('\n');

    style.textContent = rules;
  }, [cursors]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      ydocRef.current?.destroy();
    };
  }, []);

  return (
    <Editor
      height="100%"
      language={language}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      options={{
        readOnly: isReadOnly,
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        padding: { top: 12 },
        lineNumbers: 'on',
        glyphMargin: false,
        folding: true,
        automaticLayout: true,
        suggest: { showWords: true },
        quickSuggestions: !isReadOnly,
        formatOnPaste: true,
        formatOnType: false,
      }}
      onMount={handleEditorMount}
    />
  );
}
