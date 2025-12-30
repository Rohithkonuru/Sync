import React from 'react';
import { useAuth } from '../context/AuthContext';
import UnifiedDashboard from '../components/dashboards/UnifiedDashboard';
import AdminDashboard from '../components/dashboards/role-based/AdminDashboard';

const Home = () => {
  const { user } = useAuth();

  // Admin might still need a specialized view, but all other roles use the Unified Dashboard
  if (user?.user_type === 'admin') {
    return <AdminDashboard />;
  }

  return <UnifiedDashboard />;
};

export default Home;
