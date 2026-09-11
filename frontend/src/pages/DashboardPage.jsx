import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, LogIn, Trash2, Lock, Globe, Clock, Code2, Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '../components/Navbar.jsx';
import Modal from '../components/Modal.jsx';
import Spinner from '../components/Spinner.jsx';
import { getMyRooms, createRoom, joinRoom, deleteRoom } from '../api/rooms.js';
import { useAuth } from '../hooks/useAuth.js';

const LANGUAGES = [
  'javascript','typescript','python','java','cpp','c','go','rust','ruby','php',
];

const LANG_COLORS = {
  javascript:'#f7df1e', typescript:'#3178c6', python:'#3776ab',
  java:'#b07219', cpp:'#f34b7d', c:'#8be9fd', go:'#00add8',
  rust:'#dea584', ruby:'#cc342d', php:'#8892be',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [rooms, setRooms]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin]     = useState(false);

  const fetchRooms = useCallback(async () => {
    try { const { data } = await getMyRooms(); setRooms(data.rooms); }
    catch  { setError('Failed to load rooms.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const handleDelete = async (code) => {
    if (!window.confirm('Delete this room? This cannot be undone.')) return;
    try {
      await deleteRoom(code);
      setRooms(r => r.filter(rm => rm.roomCode !== code));
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete room.'); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f4f8] dark:bg-[#0f1117] transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              My Rooms
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {rooms.length > 0
                ? `${rooms.length} collaborative session${rooms.length !== 1 ? 's' : ''}`
                : 'Your collaborative coding sessions'}
            </p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setShowJoin(true)} className="btn-secondary">
              <LogIn size={15} /> Join Room
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> New Room
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200
                          dark:border-rose-800 text-rose-600 dark:text-rose-300 text-sm rounded-xl
                          px-4 py-3 mb-6">
            <span className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" />{error}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : rooms.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} onJoin={() => setShowJoin(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                userId={user?.id}
                onOpen={() => navigate(`/room/${room.roomCode}`)}
                onDelete={() => handleDelete(room.roomCode)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateRoomModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={room => {
          setRooms(r => [{ ...room, role: 'owner' }, ...r]);
          navigate(`/room/${room.roomCode}`);
        }}
      />
      <JoinRoomModal
        open={showJoin}
        onClose={() => setShowJoin(false)}
        onJoined={code => navigate(`/room/${code}`)}
      />
    </div>
  );
}

// ── Room Card ──────────────────────────────────────────────────────────────────
function RoomCard({ room, userId, onOpen, onDelete }) {
  const isOwner   = room.ownerId === userId;
  const langColor = LANG_COLORS[room.language] || '#6b7280';

  return (
    <div
      onClick={onOpen}
      className="bg-white dark:bg-[#1e2130] rounded-2xl p-5 flex flex-col gap-4 cursor-pointer
                 border border-gray-100 dark:border-gray-800
                 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]
                 hover:shadow-[0_8px_32px_rgba(14,165,233,0.18)] dark:hover:shadow-[0_8px_32px_rgba(14,165,233,0.12)]
                 hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-900
                 transition-all duration-200"
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[15px] truncate mb-1.5">
            {room.name}
          </h3>
          <span className="font-mono text-xs text-gray-400 bg-gray-100 dark:bg-gray-800
                           px-2 py-0.5 rounded-lg tracking-widest">
            {room.roomCode}
          </span>
        </div>
        <div className="flex-shrink-0">
          {room.isPrivate
            ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full
                               bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300
                               border border-amber-200 dark:border-amber-800">
                <Lock size={10}/> Private
              </span>
            : <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full
                               bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300
                               border border-emerald-200 dark:border-emerald-800">
                <Globe size={10}/> Public
              </span>}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: langColor }} />
          {room.language}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {formatDistanceToNow(new Date(room.lastActiveAt || room.createdAt), { addSuffix: true })}
        </span>
        <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
          room.role === 'owner'  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          : room.role === 'editor' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
        } capitalize`}>
          {room.role}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
        <button
          onClick={onOpen}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white
                     bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6]
                     hover:from-[#0284c7] hover:to-[#2563eb]
                     shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
                     transition-all duration-150"
        >
          Open
        </button>
        {isOwner && (
          <button
            onClick={onDelete}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                       text-gray-400 hover:text-rose-500
                       hover:bg-rose-50 dark:hover:bg-rose-900/20
                       border border-gray-200 dark:border-gray-700
                       hover:border-rose-200 dark:hover:border-rose-800
                       transition-all duration-150"
            title="Delete room" aria-label="Delete room"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ onCreate, onJoin }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5">
      <div className="w-20 h-20 rounded-2xl bg-white dark:bg-[#1e2130] flex items-center justify-center
                      shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
                      border border-gray-100 dark:border-gray-800">
        <Users size={36} className="text-blue-400" />
      </div>
      <div className="text-center">
        <p className="text-xl font-bold text-gray-800 dark:text-gray-200">No rooms yet</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1.5">
          Create a room or join one with a code.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={onJoin}   className="btn-secondary"><LogIn size={15}/> Join Room</button>
        <button onClick={onCreate} className="btn-primary" ><Plus size={15}/> New Room</button>
      </div>
    </div>
  );
}

// ── Create Room Modal ──────────────────────────────────────────────────────────
function CreateRoomModal({ open, onClose, onCreated }) {
  const [form, setForm]   = useState({ name:'', language:'javascript', isPrivate:false, password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const payload = { name: form.name, language: form.language, isPrivate: form.isPrivate };
      if (form.isPrivate && form.password) payload.password = form.password;
      const { data } = await createRoom(payload);
      onCreated(data.room); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create room.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Room">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
        <div>
          <label className="label">Room name</label>
          <input name="name" className="input" placeholder="My coding session"
            value={form.name} onChange={handleChange} required maxLength={100} />
        </div>
        <div>
          <label className="label">Language</label>
          <select name="language" className="input" value={form.language} onChange={handleChange}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" name="isPrivate" checked={form.isPrivate} onChange={handleChange}
            className="w-4 h-4 accent-blue-500 rounded" />
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Private room</span>
        </label>
        {form.isPrivate && (
          <div>
            <label className="label">Room password (optional)</label>
            <input name="password" type="password" className="input"
              placeholder="Leave blank for no password" value={form.password} onChange={handleChange} />
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading || !form.name} className="btn-primary flex-1">
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Create Room'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Join Room Modal ────────────────────────────────────────────────────────────
function JoinRoomModal({ open, onClose, onJoined }) {
  const [code, setCode]         = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await joinRoom(code.trim().toUpperCase(), password ? { password } : undefined);
      onJoined(code.trim().toUpperCase()); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Failed to join room.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Join a Room">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
        <div>
          <label className="label">Room code</label>
          <input
            className="input font-mono uppercase tracking-[0.3em] text-center text-lg font-bold"
            placeholder="XXXXXXXX" value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            required maxLength={20}
          />
        </div>
        <div>
          <label className="label">Password (if required)</label>
          <input type="password" className="input" placeholder="Leave blank if none"
            value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading || !code} className="btn-primary flex-1">
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Join Room'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
