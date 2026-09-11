import { useState } from 'react';
import { Crown, Edit3, Eye, Wifi } from 'lucide-react';
import { updateMemberRole } from '../../api/rooms.js';
import Avatar from '../Avatar.jsx';

const ROLE_CONFIG = {
  owner:  { icon: <Crown  size={11} />, color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-800/40' },
  editor: { icon: <Edit3  size={11} />, color: 'text-cyan-400',   bg: 'bg-cyan-900/30   border-cyan-800/40'   },
  viewer: { icon: <Eye    size={11} />, color: 'text-gray-400',   bg: 'bg-gray-800/50   border-gray-700/40'   },
};

export default function MembersPanel({ members, currentUserId, role, roomCode }) {
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState('');
  const isOwner = role === 'owner';

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId); setError('');
    try { await updateMemberRole(roomCode, userId, newRole); }
    catch (err) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-900">
      <div className="px-3 py-3">
        {/* Online count */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <Wifi size={12} className="text-green-400" />
          <span className="text-xs text-gray-500">
            <span className="text-green-400 font-semibold">{members.length}</span> online
          </span>
        </div>

        {error && <p className="text-rose-400 text-xs mb-3 px-1">{error}</p>}

        <div className="space-y-1">
          {members.map((member) => {
            const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
            const isMe = member.id === currentUserId;
            return (
              <div key={member.id}
                className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  <Avatar username={member.username} color={member.avatarColor} size="sm" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-gray-900" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-200 truncate font-medium">
                      {member.username}
                      {isMe && <span className="text-gray-600 text-xs ml-1">(you)</span>}
                    </span>
                  </div>
                  {/* Role badge */}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border mt-0.5 ${rc.bg} ${rc.color}`}>
                    {rc.icon} {member.role}
                  </span>
                </div>

                {/* Role selector for owner */}
                {isOwner && !isMe && member.role !== 'owner' && (
                  <select
                    value={member.role}
                    disabled={updating === member.id}
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                    className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-1.5 py-0.5
                               text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500
                               cursor-pointer transition-colors"
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
