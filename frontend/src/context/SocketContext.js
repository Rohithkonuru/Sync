import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/api';

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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const pollingIntervalRef = useRef(null);
  const lastNotificationIdRef = useRef(null);

  // Polling fallback function
  const pollNotifications = async () => {
    try {
      const countData = await notificationService.getUnreadCount();
      setUnreadCount(countData.count || 0);
      
      // Optionally fetch recent notifications
      const recentNotifications = await notificationService.getNotifications({ limit: 10 });
      if (recentNotifications.length > 0) {
        const latestId = recentNotifications[0].id;
        if (latestId !== lastNotificationIdRef.current) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map(n => n.id));
            const newNotifications = recentNotifications.filter(n => !existingIds.has(n.id));
            return [...newNotifications, ...prev];
          });
          lastNotificationIdRef.current = latestId;
        }
      }
    } catch (error) {
      console.error('Error polling notifications:', error);
    }
  };

  useEffect(() => {
    if (user && token) {
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';
      const newSocket = io(`${socketUrl}`, {
        auth: { token },
        query: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        // Clear polling if socket connects
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        // Join user's room
        newSocket.emit('join_room', { room: user.id });
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        // Start polling fallback
        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(pollNotifications, 10000); // Poll every 10 seconds
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        // Start polling fallback on connection error
        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(pollNotifications, 10000);
        }
      });

      newSocket.on('notification', (data) => {
        setNotifications((prev) => {
          // Avoid duplicates
          if (prev.some(n => n.id === data.id)) {
            return prev;
          }
          return [data, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
        lastNotificationIdRef.current = data.id;
      });

      newSocket.on('new_message', (data) => {
        // Handle new message - can be used by Message components
        console.log('New message:', data);
      });

      newSocket.on('application_status_update', (data) => {
        // Handle application status update
        console.log('Application status update:', data);
        // Create a notification-like entry
        setNotifications((prev) => [{
          id: `status_${Date.now()}`,
          type: 'application_status_update',
          title: 'Application Status Updated',
          message: data.message || 'Your application status has been updated',
          read: false,
          created_at: new Date().toISOString(),
        }, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      newSocket.on('new_post', (data) => {
        // Handle new post
        console.log('New post:', data);
      });

      setSocket(newSocket);

      // Initial notification load
      pollNotifications();

      return () => {
        newSocket.close();
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [user, token]);

  // Start polling if socket is not connected
  useEffect(() => {
    if (!isConnected && user && !pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(pollNotifications, 10000);
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isConnected, user]);

  const markNotificationRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    
    // Update on server
    try {
      await notificationService.markRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        isConnected,
        markNotificationRead,
        setUnreadCount,
        refreshNotifications: pollNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

