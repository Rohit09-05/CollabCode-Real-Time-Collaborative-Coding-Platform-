import { useState, useEffect } from 'react';
import { Play, RotateCcw, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getExecutionHistory } from '../../api/rooms.js';
import Spinner from '../Spinner.jsx';

export default function ExecutionPanel({ roomCode, currentFile, role, execResult, onRun, onClear }) {
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const canRun = role !== 'viewer';

  const handleRun = async () => {
    if (!currentFile || running) return;
    setRunning(true);
    onClear();
    // Via socket for real-time broadcast to all room members
    onRun(currentFile.id, stdin);
    // Running state will clear when execResult arrives
  };

  // When result arrives, clear loading
  useEffect(() => {
    if (execResult) setRunning(false);
  }, [execResult]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await getExecutionHistory(roomCode);
      setHistory(data.executions);
    } catch (_) {}
    finally { setLoadingHistory(false); }
  };

  const handleToggleHistory = () => {
    if (!showHistory) fetchHistory();
    setShowHistory((s) => !s);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Controls */}
      <div className="p-3 space-y-3 border-b border-editor-border">
        {currentFile && (
          <p className="text-xs text-gray-500 font-mono truncate">
            Running: <span className="text-gray-300">{currentFile.filename}</span>
          </p>
        )}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Standard input</label>
          <textarea
            rows={3}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Optional stdin..."
            className="input text-xs font-mono resize-none py-1.5"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={!canRun || running || !currentFile}
            className="btn-primary flex-1"
          >
            {running ? (
              <><Spinner size="sm" /> Running...</>
            ) : (
              <><Play size={14} /> Run Code</>
            )}
          </button>
          {execResult && (
            <button onClick={onClear} className="btn-ghost p-2" title="Clear output" aria-label="Clear output">
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {!canRun && (
          <p className="text-xs text-gray-600">Viewers cannot execute code.</p>
        )}
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        {execResult ? (
          <>
            <div className="flex items-center justify-between text-gray-500">
              <span>{execResult.triggeredBy?.username} ran the code</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {execResult.execTimeMs}ms
              </span>
            </div>

            <StatusBadge status={execResult.status} />

            {execResult.stdout && (
              <div>
                <p className="text-green-500 mb-1">stdout</p>
                <pre className="bg-gray-900 p-2 rounded text-gray-200 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                  {execResult.stdout}
                </pre>
              </div>
            )}

            {execResult.stderr && (
              <div>
                <p className="text-red-400 mb-1">stderr</p>
                <pre className="bg-gray-900 p-2 rounded text-red-300 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                  {execResult.stderr}
                </pre>
              </div>
            )}

            {!execResult.stdout && !execResult.stderr && (
              <p className="text-gray-600">(no output)</p>
            )}
          </>
        ) : (
          <p className="text-gray-600">Output will appear here after running.</p>
        )}
      </div>

      {/* History */}
      <div className="border-t border-editor-border">
        <button
          onClick={handleToggleHistory}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <span>Execution history</span>
          {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showHistory && (
          <div className="max-h-48 overflow-y-auto border-t border-editor-border">
            {loadingHistory ? (
              <div className="flex justify-center py-4"><Spinner size="sm" /></div>
            ) : history.length === 0 ? (
              <p className="text-center text-gray-600 text-xs py-3">No history yet.</p>
            ) : (
              history.map((ex) => (
                <div key={ex.id} className="px-3 py-2 border-b border-gray-800 text-xs hover:bg-gray-800">
                  <div className="flex justify-between text-gray-500">
                    <span className="font-mono">{ex.language}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {ex.exec_time_ms}ms
                    </span>
                  </div>
                  <StatusBadge status={ex.status} small />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, small }) {
  const isOk = status === 'Accepted' || status === 'success';
  return (
    <span className={`inline-block rounded px-2 py-0.5 font-semibold ${small ? 'text-[10px]' : 'text-xs'} ${
      isOk ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
    }`}>
      {status || 'Unknown'}
    </span>
  );
}
