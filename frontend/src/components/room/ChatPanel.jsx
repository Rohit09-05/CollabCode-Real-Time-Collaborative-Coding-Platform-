import { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getChatHistory } from '../../api/rooms.js';
import Avatar from '../Avatar.jsx';

export default function ChatPanel({
  messages, setMessages, typingUsers,
  user, roomCode, onSend, onTypingStart, onTypingStop,
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    getChatHistory(roomCode)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomCode, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearTyping = useCallback(() => {
    if (isTypingRef.current) { isTypingRef.current = false; onTypingStop(); }
    clearTimeout(typingTimerRef.current);
  }, [onTypingStop]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    onSend(text); setInput(''); clearTyping();
  }, [input, onSend, clearTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isTypingRef.current) { isTypingRef.current = true; onTypingStart(); }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(clearTyping, 2000);
  };

  const grouped = groupMessages(messages);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1d27]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {loading ? (
          <div className="text-center text-gray-600 text-xs py-4">Loading…</div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-10 h-10 rounded-full bg-cyan-900/30 flex items-center justify-center">
              <Send size={16} className="text-cyan-500" />
            </div>
            <p className="text-gray-600 text-xs">No messages yet. Say hello!</p>
          </div>
        ) : (
          grouped.map((group) => (
            <MessageGroup key={group.key} group={group} currentUserId={user.id} />
          ))
        )}

        {/* Typing indicators */}
        {typingUsers.filter(u => u.userId !== user.id).length > 0 && (
          <div className="flex items-center gap-2 text-xs text-cyan-500/70 italic pl-1">
            <TypingDots />
            <span>
              {typingUsers.filter(u => u.userId !== user.id).map(u => u.username).join(', ')} typing…
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-2 items-end">
          <textarea value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
            placeholder="Message…" rows={1} maxLength={2000}
            className="flex-1 resize-none bg-gray-50 dark:bg-gray-800
                       border border-gray-200 dark:border-gray-700
                       rounded-xl px-3 py-2 text-sm
                       text-gray-800 dark:text-gray-200
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                       transition-all leading-snug"
            style={{ minHeight:'38px', maxHeight:'96px' }} />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                       bg-gradient-to-br from-cyan-500 to-blue-500
                       hover:from-cyan-400 hover:to-blue-400
                       text-white shadow-md shadow-cyan-500/20
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Send"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageGroup({ group, currentUserId }) {
  const isMe = group.userId === currentUserId;
  return (
    <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar username={group.username} color={group.avatarColor} size="sm" className="mt-0.5 flex-shrink-0" />
      <div className={`flex flex-col gap-1 max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] text-gray-500 px-1">
          {isMe ? 'You' : group.username}
        </span>
        {group.messages.map((msg) => (
          <div key={msg.id} className={`rounded-2xl px-3 py-1.5 text-sm break-words leading-relaxed ${
            isMe
              ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-tr-sm shadow-md shadow-cyan-500/10'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-sm'
          }`}>
            {msg.content}
          </div>
        ))}
        <span className="text-[10px] text-gray-600 px-1">
          {formatDistanceToNow(new Date(group.messages[0].timestamp || group.messages[0].created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-0.5 items-center">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

function groupMessages(messages) {
  const groups = [];
  for (const msg of messages) {
    const uid = msg.user?.id || msg.user_id;
    const last = groups[groups.length - 1];
    if (last && last.userId === uid) {
      last.messages.push(msg);
    } else {
      groups.push({
        key: msg.id,
        userId: uid,
        username: msg.user?.username || 'Unknown',
        avatarColor: msg.user?.avatarColor || msg.user?.avatar_color,
        messages: [msg],
      });
    }
  }
  return groups;
}
