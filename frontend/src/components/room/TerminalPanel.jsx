import { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getExecutionHistory } from '../../api/rooms.js';
import Spinner from '../Spinner.jsx';

export default function TerminalPanel({ roomCode, currentFile, role, execResult, onRun, onClear }) {
  const [stdin, setStdin]             = useState('');
  const [running, setRunning]         = useState(false);
  const [showStdin, setShowStdin]     = useState(false);
  const [history, setHistory]         = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const outputRef = useRef(null);
  const canRun = role !== 'viewer';

  useEffect(() => {
    if (execResult) {
      setRunning(false);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [execResult]);

  const handleRun = () => {
    if (!currentFile || running) return;
    setRunning(true); onClear();
    onRun(currentFile.id, stdin);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try { const { data } = await getExecutionHistory(roomCode); setHistory(data.executions); }
    catch (_) {} finally { setLoadingHistory(false); }
  };

  const toggleHistory = () => { if (!showHistory) fetchHistory(); setShowHistory(s => !s); };

  return (
    <div className="flex h-full font-mono text-sm bg-white dark:bg-[#0f1117]">

      {/* ── Output area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-800
                        bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          {currentFile && (
            <span className="text-xs truncate text-gray-500 dark:text-gray-400">
          <span className="text-cyan-600 dark:text-cyan-400">{currentFile.filename}</span>
              <span className="text-gray-400 ml-1">({currentFile.language})</span>
            </span>
          )}
          <div className="flex-1" />

          <button onClick={() => setShowStdin(s => !s)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors px-2 py-0.5 rounded hover:bg-white/5">
            stdin {showStdin ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {execResult && (
            <button onClick={onClear}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-rose-400 transition-colors px-2 py-0.5 rounded hover:bg-white/5">
              <RotateCcw size={11} /> clear
            </button>
          )}

          <button onClick={handleRun} disabled={!canRun || running || !currentFile}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold
                       bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6]
                       hover:from-[#0284c7] hover:to-[#2563eb]
                       text-white shadow-md shadow-blue-500/25
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {running ? <Spinner size="sm" /> : <Play size={11} />}
            {running ? 'Running…' : 'Run'}
          </button>
        </div>

        {/* stdin */}
        {showStdin && (
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
            <textarea rows={2} value={stdin} onChange={e => setStdin(e.target.value)}
              placeholder="Standard input (stdin)…"
              className="w-full bg-gray-50 dark:bg-gray-800
                       border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5
                       text-xs font-mono text-gray-700 dark:text-gray-300 placeholder-gray-400
                       resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        )}

        {/* Output */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {!execResult && !running && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-600 text-xs pt-1">
              <span className="text-blue-500 text-base">▶</span>
              <span>Press <kbd className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 font-mono text-[11px]">Run</kbd> to execute{currentFile ? ` ${currentFile.filename}` : ''}</span>
            </div>
          )}

          {running && (
            <div className="flex items-center gap-2 text-yellow-400 text-xs">
              <Spinner size="sm" /> <span>Executing code…</span>
            </div>
          )}

          {execResult && (
            <div className="space-y-3" ref={outputRef}>
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs border-b border-gray-800 pb-2">
                <span className="text-gray-500">{execResult.triggeredBy?.username} ran the code</span>
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock size={10} />{execResult.execTimeMs}ms
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  execResult.status === 'Accepted'
                    ? 'bg-green-900/40 text-green-400 border-green-800/50'
                    : 'bg-rose-900/40 text-rose-400 border-rose-800/50'
                }`}>
                  {execResult.status}
                </span>
              </div>

              {execResult.stdout && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> stdout
                  </div>
                  <pre className="bg-black/60 border border-green-900/30 rounded-xl px-4 py-3
                                  text-green-300 text-xs whitespace-pre-wrap break-all leading-relaxed
                                  max-h-52 overflow-y-auto">
                    {execResult.stdout}
                  </pre>
                </div>
              )}

              {execResult.stderr && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> stderr
                  </div>
                  <pre className="bg-black/60 border border-rose-900/30 rounded-xl px-4 py-3
                                  text-rose-300 text-xs whitespace-pre-wrap break-all leading-relaxed
                                  max-h-52 overflow-y-auto">
                    {execResult.stderr}
                  </pre>
                </div>
              )}

              {!execResult.stdout && !execResult.stderr && (
                <p className="text-gray-700 text-xs">(no output)</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── History sidebar ──────────────────────────────────────────────── */}
      <div className="w-48 flex-shrink-0 border-l border-gray-200 dark:border-gray-800
                      flex flex-col bg-gray-50 dark:bg-gray-900">
        <button onClick={toggleHistory}
          className="flex items-center justify-between px-3 py-2 text-xs border-b
                     border-gray-200 dark:border-gray-800
                     text-gray-500 dark:text-gray-500
                     hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-full">
          <span className="font-bold uppercase tracking-widest text-[10px]">History</span>
          {showHistory ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        <div className="flex-1 overflow-y-auto">
          {!showHistory ? (
            <div className="text-xs text-gray-700 px-3 py-4 text-center">Click to load</div>
          ) : loadingHistory ? (
            <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          ) : history.length === 0 ? (
            <div className="text-xs text-gray-700 px-3 py-4 text-center">No history yet.</div>
          ) : (
            history.map((ex) => (
              <div key={ex.id}
                className="px-3 py-2 border-b border-gray-200 dark:border-gray-800
                           hover:bg-white dark:hover:bg-gray-800 text-xs cursor-default transition-colors">
                <div className="flex justify-between text-gray-500 dark:text-gray-500 mb-0.5">
                  <span className="text-blue-600 dark:text-blue-400">{ex.language}</span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Clock size={9} />{ex.exec_time_ms}ms
                  </span>
                </div>
                <span className={`text-[10px] font-bold ${
                  ex.status === 'Accepted' ? 'text-green-500' : 'text-rose-400'
                }`}>{ex.status}</span>
                {ex.stdout && (
                  <div className="text-gray-600 truncate mt-0.5 text-[10px]">{ex.stdout.slice(0, 35)}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
