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

  // Disable WebSocket for now - use polling only
  useEffect(() => {
    // Only use polling fallback for notifications
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        pollNotifications();
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

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
    // Only use polling fallback for notifications
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        pollNotifications();
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

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

  const value = {
    socket: null,
    notifications,
    unreadCount,
    isConnected: false,
    sendNotification: async (userId, notificationData) => {
      // Fallback: create notification via API
      try {
        await notificationService.createNotification({
          user_id: userId,
          ...notificationData
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    },
    markNotificationRead,
    setUnreadCount,
    refreshNotifications: pollNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

