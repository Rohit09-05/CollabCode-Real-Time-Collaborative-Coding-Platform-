import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Terminal, Users, X, ChevronDown, ChevronUp, Play, Sun, Moon } from 'lucide-react';
import { useRoom } from '../../hooks/useRoom.js';
import { useSocket } from '../../hooks/useSocket.js';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import FileExplorer from './FileExplorer.jsx';
import CollabEditor from './CollabEditor.jsx';
import ChatPanel from './ChatPanel.jsx';
import TerminalPanel from './TerminalPanel.jsx';
import MembersPanel from './MembersPanel.jsx';
import ConnectionBadge from '../ConnectionBadge.jsx';
import Spinner from '../Spinner.jsx';

export default function RoomLayout({ roomCode, roomInfo, user }) {
  const navigate = useNavigate();
  const { connected } = useSocket();
  const { theme, toggle: toggleTheme } = useTheme();

  const {
    roomState, members, cursors, typingUsers,
    messages, execResult, joined,
    registerCodeHandler, sendMessage,
    sendCursorMove, sendCodeChange,
    runCode, sendTypingStart, sendTypingStop,
    setExecResult, setMessages,
  } = useRoom(roomCode);

  const [activeFileId, setActiveFileId] = useState(null);
  const [sidePanel, setSidePanel] = useState('chat');   // 'chat' | 'members' | null
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(220);
  const dragRef = useRef(null);

  const files = roomState?.files || roomInfo?.files || [];
  const role  = roomState?.role  || roomInfo?.role  || 'viewer';

  const currentFileId = activeFileId || files[0]?.id;
  const currentFile   = files.find((f) => f.id === currentFileId);

  // ── Drag-to-resize terminal ───────────────────────────────────────────────
  const startDrag = (e) => {
    e.preventDefault();
    const startY  = e.clientY;
    const startH  = terminalHeight;

    const onMove = (mv) => {
      const delta = startY - mv.clientY;
      setTerminalHeight(Math.min(500, Math.max(80, startH + delta)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!joined && !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-editor-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden transition-colors
                    bg-[#f0f4f8] dark:bg-[#0f1117] text-gray-900 dark:text-gray-100">

      {/* ── Title bar ─────────────────────────────────────────────────────── */}
      <header className="h-12 flex items-center px-4 gap-3 flex-shrink-0 transition-colors
                       bg-white dark:bg-[#1a1d27]
                       border-b border-gray-200 dark:border-gray-800
                       shadow-[0_1px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
        <button onClick={() => navigate('/dashboard')}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400
                     hover:text-blue-600 dark:hover:text-blue-400
                     hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          aria-label="Back to dashboard">
          <ArrowLeft size={16} />
        </button>

        <span className="font-bold text-gray-900 dark:text-white truncate max-w-[180px] text-[15px]">
          {roomInfo?.room?.name || roomCode}
        </span>

        <span className="font-mono text-xs text-blue-600 dark:text-blue-400
                         bg-blue-50 dark:bg-blue-900/30
                         border border-blue-200 dark:border-blue-800
                         px-2 py-0.5 rounded-lg hidden sm:inline tracking-wider">
          {roomCode}
        </span>

        <span className="px-2.5 py-0.5 rounded-full text-xs capitalize font-semibold
                         bg-gray-100 dark:bg-gray-800
                         text-gray-600 dark:text-gray-300
                         border border-gray-200 dark:border-gray-700">
          {role}
        </span>

        <div className="flex-1" />

        <ConnectionBadge connected={connected} />

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all
                     bg-gray-100 dark:bg-gray-800
                     border border-gray-200 dark:border-gray-700
                     text-gray-500 hover:text-gray-800 dark:hover:text-gray-100"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-500" />}
        </button>

        {role !== 'viewer' && currentFile && (
          <button
            onClick={() => { setTerminalOpen(true); runCode(currentFile.id, ''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                       bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6]
                       hover:from-[#0284c7] hover:to-[#2563eb]
                       text-white shadow-md shadow-blue-500/25 transition-all"
          >
            <Play size={12} /> Run
          </button>
        )}

        {/* Side panel toggles */}
        <div className="flex items-center gap-1 ml-1">
          <PanelBtn
            icon={<Users size={15} />}
            label="Members"
            active={sidePanel === 'members'}
            badge={members.length}
            onClick={() => setSidePanel((p) => p === 'members' ? null : 'members')}
          />
          <PanelBtn
            icon={<MessageSquare size={15} />}
            label="Chat"
            active={sidePanel === 'chat'}
            onClick={() => setSidePanel((p) => p === 'chat' ? null : 'chat')}
          />
        </div>
      </header>

      {/* ── Body (file tree + editor + right panel) ────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* File sidebar */}
        <aside className="w-48 flex-shrink-0 border-r overflow-y-auto
                         bg-white dark:bg-[#1a1d27]
                         border-gray-200 dark:border-gray-800">
          <FileExplorer
            files={files}
            activeFileId={currentFileId}
            role={role}
            roomCode={roomCode}
            onSelect={setActiveFileId}
          />
        </aside>

        {/* Centre column: editor + terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {currentFile ? (
              <CollabEditor
                key={currentFileId}
                file={currentFile}
                roomCode={roomCode}
                role={role}
                user={user}
                cursors={cursors}
                registerCodeHandler={registerCodeHandler}
                sendCodeChange={sendCodeChange}
                sendCursorMove={sendCursorMove}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                Select a file to start editing
              </div>
            )}
          </div>

          {/* ── Bottom terminal panel ──────────────────────────────────────── */}
          <div
            className="flex-shrink-0 flex flex-col border-t border-gray-200 dark:border-gray-800
                       bg-white dark:bg-[#0f1117]"
            style={{ height: terminalOpen ? terminalHeight : 32 }}
          >
            {/* Drag handle + terminal tab bar */}
            <div className="h-8 flex items-center px-3 gap-2
                          bg-gray-50 dark:bg-[#1a1d27]
                          border-b border-gray-200 dark:border-gray-800
                          cursor-ns-resize select-none flex-shrink-0"
              onMouseDown={terminalOpen ? startDrag : undefined}
            >
              {/* Drag grip */}
              {terminalOpen && (
                <div className="flex flex-col gap-0.5 mr-1 opacity-30">
                  <div className="w-4 h-px bg-gray-400" />
                  <div className="w-4 h-px bg-gray-400" />
                </div>
              )}

              <Terminal size={13} className="text-blue-500 dark:text-blue-400" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">Terminal</span>

              {execResult && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ml-1 ${
                  execResult.status === 'Accepted' ? 'bg-green-900/60 text-green-400' : 'bg-red-900/60 text-red-400'
                }`}>
                  {execResult.status}
                </span>
              )}

              <div className="flex-1" />

              {execResult && (
                <button onClick={() => setExecResult(null)}
                className="text-xs text-gray-400 hover:text-red-500 px-1 transition-colors"
                title="Clear">clear</button>
              )}

              <button
                onClick={() => setTerminalOpen((o) => !o)}
                className="btn-ghost p-0.5 rounded text-gray-500"
                aria-label={terminalOpen ? 'Collapse terminal' : 'Expand terminal'}
              >
                {terminalOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>

            {/* Terminal body */}
            {terminalOpen && (
              <div className="flex-1 overflow-hidden">
                <TerminalPanel
                  roomCode={roomCode}
                  currentFile={currentFile}
                  role={role}
                  execResult={execResult}
                  onRun={runCode}
                  onClear={() => setExecResult(null)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Right side panel (Chat / Members) ──────────────────────────── */}
        {sidePanel && (
          <aside className="w-72 flex-shrink-0 flex flex-col overflow-hidden
                           bg-white dark:bg-[#1a1d27]
                           border-l border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-3 py-2.5
                            border-b border-gray-200 dark:border-gray-800">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                {sidePanel === 'chat' ? 'Chat' : 'Members'}
              </span>
              <button onClick={() => setSidePanel(null)}
                className="w-6 h-6 rounded-lg flex items-center justify-center
                           text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                           hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {sidePanel === 'chat' && (
                <ChatPanel
                  messages={messages}
                  setMessages={setMessages}
                  typingUsers={typingUsers}
                  user={user}
                  roomCode={roomCode}
                  onSend={sendMessage}
                  onTypingStart={sendTypingStart}
                  onTypingStop={sendTypingStop}
                />
              )}
              {sidePanel === 'members' && (
                <MembersPanel
                  members={members}
                  currentUserId={user.id}
                  role={role}
                  roomCode={roomCode}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function PanelBtn({ icon, label, active, badge, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
      }`}
      title={label} aria-pressed={active}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-0.5 bg-blue-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}
