import { useState } from 'react';
import { Crown, Edit3, Eye, Wifi, Check } from 'lucide-react';
import { updateMemberRole } from '../../api/rooms.js';
import Avatar from '../Avatar.jsx';

const ROLE_CONFIG = {
  owner:  { icon: <Crown size={11} />, color: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800/40' },
  editor: { icon: <Edit3 size={11} />, color: 'text-blue-600 dark:text-cyan-400',     bg: 'bg-blue-50  dark:bg-cyan-900/30   border-blue-200  dark:border-cyan-800/40'   },
  viewer: { icon: <Eye   size={11} />, color: 'text-gray-500 dark:text-gray-400',     bg: 'bg-gray-100 dark:bg-gray-800/50   border-gray-200  dark:border-gray-700/40'   },
};

export default function MembersPanel({ members, currentUserId, role, roomCode }) {
  const [localRoles, setLocalRoles] = useState({});
  const [updating, setUpdating]     = useState(null);
  const [success, setSuccess]       = useState(null);
  const [error, setError]           = useState('');
  const isOwner = role === 'owner';

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId); setError(''); setSuccess(null);
    // Optimistically update local state immediately
    setLocalRoles(prev => ({ ...prev, [userId]: newRole }));
    try {
      await updateMemberRole(roomCode, userId, newRole);
      setSuccess(userId);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      // Revert on failure
      setLocalRoles(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setError(err.response?.data?.message || 'Failed to update role.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white dark:bg-[#1a1d27]">
      <div className="px-3 py-3">
        {/* Online count */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <Wifi size={12} className="text-green-500" />
          <span className="text-xs text-gray-500 dark:text-gray-500">
            <span className="text-green-500 font-semibold">{members.length}</span> online
          </span>
        </div>

        {error && (
          <p className="text-rose-500 text-xs mb-3 px-1 font-medium">{error}</p>
        )}

        <div className="space-y-1">
          {members.map((member) => {
            const effectiveRole = localRoles[member.id] || member.role;
            const rc = ROLE_CONFIG[effectiveRole] || ROLE_CONFIG.viewer;
            const isMe = member.id === currentUserId;

            return (
              <div key={member.id}
                className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl
                           hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  <Avatar username={member.username} color={member.avatarColor} size="sm" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full
                                   border-2 border-white dark:border-gray-900" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {member.username}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-600">(you)</span>
                    )}
                    {success === member.id && (
                      <Check size={12} className="text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  {/* Role badge */}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold
                                    px-1.5 py-0.5 rounded-full border mt-0.5 ${rc.bg} ${rc.color}`}>
                    {rc.icon} {effectiveRole}
                  </span>
                </div>

                {/* Role selector — only owner sees this, not for themselves or other owners */}
                {isOwner && !isMe && member.role !== 'owner' && (
                  <select
                    value={effectiveRole}
                    disabled={updating === member.id}
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                    className="text-xs bg-white dark:bg-gray-800
                               border border-gray-200 dark:border-gray-700
                               rounded-lg px-2 py-1
                               text-gray-700 dark:text-gray-300
                               focus:outline-none focus:ring-2 focus:ring-blue-400
                               cursor-pointer transition-colors
                               disabled:opacity-50 disabled:cursor-wait"
                    aria-label={`Change ${member.username}'s role`}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
