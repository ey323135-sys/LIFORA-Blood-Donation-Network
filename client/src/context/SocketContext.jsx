import React, { createContext, useEffect, useState, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useContext(AuthContext);
  const socketRef = useRef(null);

  useEffect(() => {
    // Determine socket server URL:
    // In production (same-origin deploy), use window.location.origin
    // If VITE_API_URL is set (separate backend domain), use that
    const serverUrl = import.meta.env.VITE_API_URL || window.location.origin;

    const newSocket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      // Pass JWT in auth for authenticated socket connections
      auth: token ? { token } : {}
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[LIFORA Socket] Connected:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[LIFORA Socket] Disconnected:', reason);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[LIFORA Socket] Connection error:', err.message);
    });

    return () => {
      newSocket.disconnect();
    };
    // Only re-create socket when token changes (login/logout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Join private user room once user is authenticated
  useEffect(() => {
    if (socket && user && user.id) {
      socket.emit('join_room', user.id);
      console.log('[LIFORA Socket] Joined user room:', user.id);
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
