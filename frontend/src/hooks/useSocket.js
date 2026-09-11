import { useContext } from 'react';
import { SocketContext } from '../contexts/SocketContext.jsx';

export function useSocket() {
  return useContext(SocketContext);
}
