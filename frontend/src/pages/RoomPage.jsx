import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { joinRoom } from '../api/rooms.js';
import { SocketProvider } from '../contexts/SocketContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import RoomLayout from '../components/room/RoomLayout.jsx';
import Spinner from '../components/Spinner.jsx';

export default function RoomPage() {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roomInfo, setRoomInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    joinRoom(code)
      .then(({ data }) => setRoomInfo(data))
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to join room.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
        <p className="text-red-400 text-lg">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <SocketProvider token={token}>
      <RoomLayout roomCode={code} roomInfo={roomInfo} user={user} />
    </SocketProvider>
  );
}
