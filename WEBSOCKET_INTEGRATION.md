# WebSocket Integration Guide

## Overview

The application uses Socket.IO for real-time notifications and messaging. This guide explains how to integrate WebSocket functionality in the frontend.

## Backend Setup

The WebSocket server is already configured in `backend/app/services/socket_manager.py` and integrated into the main app via `backend/app/main.py`.

### Connection URL
```
ws://localhost:8000 (development)
wss://your-domain.com (production)
```

## Frontend Integration

### 1. Install Socket.IO Client

```bash
cd frontend
npm install socket.io-client
```

### 2. Update SocketContext

Update `frontend/src/context/SocketContext.js`:

```javascript
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/api';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    if (user && token) {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      
      // Connect to Socket.IO
      const newSocket = io(API_URL, {
        query: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Join user's room
        newSocket.emit('join_room', { room: user.id });
        
        // Load initial notifications
        loadNotifications();
        
        // Clear polling if WebSocket is working
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Fallback to polling
        startPolling();
      });

      newSocket.on('notification', (data) => {
        console.log('New notification:', data);
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast.success(data.message || data.title, {
          icon: '🔔',
          duration: 5000
        });
      });

      newSocket.on('new_message', (data) => {
        console.log('New message:', data);
        // Handle new message
        toast.success(`New message from ${data.sender_name || 'someone'}`);
      });

      newSocket.on('application_status_update', (data) => {
        console.log('Application status update:', data);
        toast.success(`Your application status: ${data.status}`);
      });

      newSocket.on('connected', (data) => {
        console.log('Socket connected:', data);
      });

      setSocket(newSocket);

      // Fallback polling function
      const startPolling = () => {
        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(async () => {
            try {
              const count = await notificationService.getUnreadCount();
              setUnreadCount(count.count || 0);
              
              // Load new notifications
              const newNotifications = await notificationService.getNotifications({ 
                limit: 10, 
                unread_only: true 
              });
              if (newNotifications.length > 0) {
                setNotifications(prev => {
                  const existingIds = new Set(prev.map(n => n.id));
                  const newOnes = newNotifications.filter(n => !existingIds.has(n.id));
                  return [...newOnes, ...prev];
                });
              }
            } catch (error) {
              console.error('Polling error:', error);
            }
          }, 10000); // Poll every 10 seconds
        }
      };

      // Start polling as fallback
      startPolling();

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        newSocket.close();
      };
    }
  }, [user, token]);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getNotifications({ limit: 20 }),
        notificationService.getUnreadCount()
      ]);
      setNotifications(notifs || []);
      setUnreadCount(count.count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const value = {
    socket,
    isConnected,
    unreadCount,
    notifications,
    loadNotifications,
    markAsRead,
    markAllAsRead
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
```

### 3. Update Navbar to Use Socket Context

The Navbar already uses `useSocket()` hook. Ensure it's wrapped in `SocketProvider` in `App.js` (already done).

### 4. Real-time Message Updates

For messaging, add to your Messages component:

```javascript
import { useSocket } from '../context/SocketContext';

const Messages = () => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on('typing', (data) => {
        if (data.typing) {
          setTypingUsers(prev => [...new Set([...prev, data.sender_id])]);
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.sender_id));
        }
      });

      return () => {
        socket.off('new_message');
        socket.off('typing');
      };
    }
  }, [socket]);

  const sendTypingIndicator = (receiverId, isTyping) => {
    if (socket) {
      socket.emit(isTyping ? 'typing_start' : 'typing_stop', {
        receiver_id: receiverId,
        sender_id: currentUser.id
      });
    }
  };

  // ... rest of component
};
```

## Testing WebSocket Connection

### Browser Console Test

1. Open browser console
2. Check for "WebSocket connected" message
3. Send a test notification from backend
4. Verify notification appears in real-time

### Manual Test

```javascript
// In browser console
const socket = io('http://localhost:8000', {
  query: { token: 'YOUR_TOKEN' }
});

socket.on('connect', () => console.log('Connected'));
socket.on('notification', (data) => console.log('Notification:', data));
```

## Production Configuration

### Environment Variables

```bash
# .env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_WS_URL=wss://api.yourdomain.com
```

### Nginx Configuration (if using reverse proxy)

```nginx
location /socket.io/ {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Troubleshooting

### Connection Issues
- Check CORS settings in backend
- Verify token is valid
- Check WebSocket URL matches API URL
- Ensure Socket.IO server is running

### Notifications Not Appearing
- Check browser console for errors
- Verify WebSocket connection status
- Check notification service is creating notifications
- Verify user is in correct room

### Fallback to Polling
- If WebSocket fails, polling automatically starts
- Polling interval: 10 seconds
- Check network tab for polling requests

