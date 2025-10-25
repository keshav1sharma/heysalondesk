import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const useWebSocket = (onNewRequest, onRequestResolved, onKBUpdated) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  // Use refs to store callbacks to avoid reconnecting on every render
  const onNewRequestRef = useRef(onNewRequest);
  const onRequestResolvedRef = useRef(onRequestResolved);
  const onKBUpdatedRef = useRef(onKBUpdated);

  // Update refs when callbacks change
  useEffect(() => {
    onNewRequestRef.current = onNewRequest;
    onRequestResolvedRef.current = onRequestResolved;
    onKBUpdatedRef.current = onKBUpdated;
  }, [onNewRequest, onRequestResolved, onKBUpdated]);

  useEffect(() => {
    const socketInstance = io(WS_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      socketInstance.emit('subscribe', { room: 'supervisor' });
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socketInstance.on('new_help_request', (data) => {
      console.log('New help request:', data);
      if (onNewRequestRef.current) onNewRequestRef.current(data);
    });

    socketInstance.on('request_resolved', (data) => {
      console.log('Request resolved:', data);
      if (onRequestResolvedRef.current) onRequestResolvedRef.current(data);
    });

    socketInstance.on('kb_updated', (data) => {
      console.log('KB updated:', data);
      if (onKBUpdatedRef.current) onKBUpdatedRef.current(data);
    });

    socketInstance.on('request_timeout_warning', (data) => {
      console.log('Timeout warning:', data);
    });

    setSocket(socketInstance);

    return () => {
      console.log('Disconnecting WebSocket...');
      socketInstance.disconnect();
    };
  }, []); // Empty dependency array - only connect once!

  return { socket, connected };
};
