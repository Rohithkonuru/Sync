import { useEffect, useState, useCallback } from 'react';

const useRealtime = () => {
  const [websocket, setWebsocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const setupWebSocket = () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || user._id;

        if (!token || !userId || websocket?.readyState === WebSocket.OPEN) {
          return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const backendUrl = process.env.REACT_APP_API_URL || window.location.origin;
        const wsUrl = `${protocol}//${backendUrl.replace(/^https?:\/\//, '')}/ws/${userId}?token=${token}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            setLastMessage(message);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          setConnected(false);
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
          setConnected(false);
          setTimeout(setupWebSocket, 3000);
        };

        setWebsocket(ws);

        return () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (err) {
        console.error('WebSocket setup error:', err);
      }
    };

    setupWebSocket();
  }, []);

  const sendMessage = useCallback(
    (type, payload = {}) => {
      if (websocket?.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type, payload }));
      }
    },
    [websocket]
  );

  return {
    connected,
    lastMessage,
    sendMessage,
    websocket,
  };
};

export default useRealtime;
