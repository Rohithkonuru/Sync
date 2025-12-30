import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Badge } from '../ui';
import { FiUsers, FiActivity, FiShield, FiAlertTriangle, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    reportedContent: 0,
    systemHealth: 'Good'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock loading admin data
    setTimeout(() => {
      setStats({
        totalUsers: 12543,
        activeUsers: 892,
        reportedContent: 5,
        systemHealth: 'Good'
      });
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
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
          <Badge variant="error">System Admin</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Users</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiActivity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Active Users</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.activeUsers}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Reported Content</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.reportedContent}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiShield className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">System Health</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.systemHealth}</p>
              </div>
            </div>
          </Card>
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
