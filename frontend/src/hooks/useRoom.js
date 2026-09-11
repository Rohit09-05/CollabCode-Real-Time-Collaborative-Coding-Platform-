import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket.js';

/**
 * Manages all room-level socket state:
 * files, members, chat messages, execution results, cursors, typing indicators.
 */
export function useRoom(roomCode) {
  const { socket } = useSocket();

  const [roomState, setRoomState] = useState(null);   // { files, members, role }
  const [members, setMembers] = useState([]);
  const [cursors, setCursors] = useState({});          // userId -> { position, selection, username, avatarColor, fileId }
  const [typingUsers, setTypingUsers] = useState([]);  // [{ userId, username }]
  const [messages, setMessages] = useState([]);
  const [execResult, setExecResult] = useState(null);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);

  // Pending code_update callbacks, keyed by fileId
  const codeUpdateHandlers = useRef({});

  const registerCodeHandler = useCallback((fileId, handler) => {
    codeUpdateHandlers.current[fileId] = handler;
    return () => { delete codeUpdateHandlers.current[fileId]; };
  }, []);

  useEffect(() => {
    if (!socket || !roomCode) return;

    // Join the room
    socket.emit('join_room', { roomCode });

    socket.on('room_state', ({ files, members: m, role }) => {
      setRoomState({ files, role });
      setMembers(m);
      setJoined(true);
    });

    socket.on('user_joined', ({ user }) => {
      setMembers((prev) => {
        if (prev.find((m) => m.id === user.id)) return prev;
        return [...prev, user];
      });
    });

    socket.on('user_left', ({ userId }) => {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      setCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on('code_update', ({ fileId, delta, version, authorId }) => {
      const handler = codeUpdateHandlers.current[fileId];
      if (handler) handler({ delta, version, authorId });
    });

    socket.on('cursor_update', ({ userId, fileId, position, selection, username, avatarColor }) => {
      setCursors((prev) => ({
        ...prev,
        [userId]: { position, selection, username, avatarColor, fileId },
      }));
    });

    socket.on('chat_broadcast', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user_typing', ({ userId, username }) => {
      setTypingUsers((prev) => {
        if (prev.find((u) => u.userId === userId)) return prev;
        return [...prev, { userId, username }];
      });
    });

    socket.on('user_stopped_typing', ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    socket.on('execution_result', (result) => {
      setExecResult(result);
    });

    socket.on('error', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.emit('leave_room');
      socket.off('room_state');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('code_update');
      socket.off('cursor_update');
      socket.off('chat_broadcast');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('execution_result');
      socket.off('error');
      setJoined(false);
    };
  }, [socket, roomCode]);

  const sendMessage = useCallback((content) => {
    socket?.emit('chat_message', { content });
  }, [socket]);

  const sendCursorMove = useCallback((fileId, position, selection) => {
    socket?.volatile.emit('cursor_move', { fileId, position, selection });
  }, [socket]);

  const sendCodeChange = useCallback((fileId, delta, version, content) => {
    socket?.emit('code_change', { fileId, delta, version, content });
  }, [socket]);

  const runCode = useCallback((fileId, stdin) => {
    socket?.emit('run_code', { fileId, stdin });
  }, [socket]);

  const sendTypingStart = useCallback(() => socket?.emit('typing_start'), [socket]);
  const sendTypingStop = useCallback(() => socket?.emit('typing_stop'), [socket]);

  return {
    roomState,
    members,
    cursors,
    typingUsers,
    messages,
    execResult,
    error,
    joined,
    registerCodeHandler,
    sendMessage,
    sendCursorMove,
    sendCodeChange,
    runCode,
    sendTypingStart,
    sendTypingStop,
    setMessages,
    setExecResult,
  };
}
