import { useState } from 'react';
import { FilePlus, Trash2, FileCode } from 'lucide-react';
import { createFile, deleteFile } from '../../api/rooms.js';

const LANG_COLORS = {
  javascript:'#f7df1e', typescript:'#3178c6', python:'#3776ab',
  java:'#b07219', cpp:'#f34b7d', c:'#8be9fd', go:'#00add8',
  rust:'#dea584', ruby:'#cc342d', php:'#8892be',
};

export default function FileExplorer({ files, activeFileId, role, roomCode, onSelect }) {
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [error, setError]     = useState('');
  const canEdit = role === 'owner' || role === 'editor';

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createFile(roomCode, { filename: newName.trim(), language: detectLang(newName) });
      setNewName(''); setShowNew(false);
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Delete this file?')) return;
    try { await deleteFile(roomCode, fileId); }
    catch (err) { setError(err.response?.data?.message || 'Failed.'); }
  };

  return (
    <div className="py-2 h-full bg-white dark:bg-[#1a1d27]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
          Explorer
        </span>
        {canEdit && (
          <button onClick={() => setShowNew(s => !s)}
            className="w-5 h-5 rounded flex items-center justify-center
                       text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
                       hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="New file" aria-label="New file">
            <FilePlus size={13} />
          </button>
        )}
      </div>

      {/* New file input */}
      {showNew && (
        <form onSubmit={handleCreate} className="px-2 mb-2">
          <input autoFocus
            className="w-full bg-white dark:bg-gray-800
                       border border-blue-300 dark:border-blue-700 rounded-lg px-2 py-1
                       text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="filename.js"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setShowNew(false)}
          />
          {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
        </form>
      )}

      {/* Files */}
      {files.map(file => {
        const isActive = file.id === activeFileId;
        return (
          <div key={file.id} onClick={() => onSelect(file.id)}
            className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs transition-all
                        border-l-2 ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500 text-blue-700 dark:text-blue-300'
                : 'border-l-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
            }`}>
            <FileCode size={12} style={{ color: LANG_COLORS[file.language] || '#94a3b8' }} className="flex-shrink-0" />
            <span className="flex-1 truncate font-mono font-medium">{file.filename}</span>
            {canEdit && files.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); handleDelete(file.id); }}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center
                           text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
                aria-label="Delete file">
                <Trash2 size={10} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function detectLang(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map = { js:'javascript', ts:'typescript', py:'python', java:'java', cpp:'cpp', c:'c', go:'go', rs:'rust', rb:'ruby', php:'php' };
  return map[ext] || 'javascript';
}
