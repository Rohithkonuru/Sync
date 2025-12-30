import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Button, Card, Badge } from '../../ui';
import { FiUsers, FiActivity, FiShield, FiSettings } from 'react-icons/fi';

// Shared Components
import StatsCard from '../shared/StatsCard';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 12543,
    activeUsers: 892,
    reportedContent: 5,
    systemHealth: 'Good'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock loading admin data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
          <Badge variant="error">System Admin</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Users" value={stats.totalUsers} icon={FiUsers} color="blue" />
          <StatsCard title="Active Users" value={stats.activeUsers} icon={FiActivity} color="green" />
          <StatsCard title="Reports" value={stats.reportedContent} icon={FiShield} color="red" />
          <StatsCard title="System Health" value={stats.systemHealth} icon={FiSettings} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">System Actions</h3>
            <div className="space-y-4">
              <Button variant="secondary" fullWidth className="justify-between">
                <span>Manage Users</span>
                <FiSettings />
              </Button>
              <Button variant="secondary" fullWidth className="justify-between">
                <span>Content Moderation</span>
                <FiShield />
              </Button>
              <Button variant="secondary" fullWidth className="justify-between">
                <span>System Logs</span>
                <FiActivity />
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Alerts</h3>
            <div className="text-center py-8 text-neutral-500">
              No critical alerts.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
