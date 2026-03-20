import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { authService, userService } from '../services/api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser || null);
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.getCurrentUser();
      updateUser(me);
      return me;
    } catch {
      return null;
    }
  }, [updateUser]);

  const refreshProfile = useCallback(async (userId) => {
    if (!userId) return null;
    const profile = await userService.getProfile(userId);
    if (String(profile?.id || profile?._id) === String(user?.id || user?._id)) {
      updateUser(profile);
    }
    return profile;
  }, [updateUser, user]);

  const value = useMemo(
    () => ({ user, updateUser, refreshUser, refreshProfile }),
    [user, updateUser, refreshUser, refreshProfile]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
