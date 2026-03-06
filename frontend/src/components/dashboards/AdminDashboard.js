import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Badge } from '../ui';
import { FiUsers, FiActivity, FiShield, FiAlertTriangle, FiSettings, FiBookmark, FiTrendingUp } from 'react-icons/fi';
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN - Admin Profile & Quick Actions (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Admin Profile Card */}
            <Card>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-3">
                  <FiShield className="text-gray-500 w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900">{user.first_name} {user.last_name}</h3>
                <p className="text-sm text-gray-500 mb-3">System Administrator</p>
                <div className="space-y-2">
                  <div className="text-center">
                    <span className="block font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</span>
                    <span className="text-xs text-gray-500">Total Users</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-green-600">{stats.activeUsers}</span>
                    <span className="text-xs text-gray-500">Active Users</span>
                  </div>
                </div>
                <Button fullWidth variant="outline" size="sm" className="mt-3" onClick={() => {}}>Admin Settings</Button>
              </div>
            </Card>

            {/* System Status */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">System Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">System Health</span>
                  <span className="font-bold text-green-600">{stats.systemHealth}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Server Uptime</span>
                  <span className="font-bold text-blue-600">99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Backup</span>
                  <span className="font-bold text-purple-600">2 hours ago</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Quick Actions</h3>
              <div className="space-y-2">
                <Button fullWidth variant="outline" size="sm" className="justify-start text-left" onClick={() => {}}>
                  <FiUsers className="mr-2" /> Manage Users
                </Button>
                <Button fullWidth variant="outline" size="sm" className="justify-start text-left" onClick={() => {}}>
                  <FiShield className="mr-2" /> Security Settings
                </Button>
                <Button fullWidth variant="outline" size="sm" className="justify-start text-left" onClick={() => {}}>
                  <FiActivity className="mr-2" /> System Logs
                </Button>
                <Button fullWidth variant="outline" size="sm" className="justify-start text-left" onClick={() => {}}>
                  <FiSettings className="mr-2" /> Admin Settings
                </Button>
              </div>
            </Card>

            {/* Saved Reports */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <FiBookmark className="text-blue-500" /> Saved Reports
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-700 hover:bg-gray-50 p-2 rounded cursor-pointer">
                  <p className="font-medium text-xs">Monthly Analytics</p>
                  <p className="text-xs text-gray-500">Generated 2 days ago</p>
                </div>
                <div className="text-sm text-gray-700 hover:bg-gray-50 p-2 rounded cursor-pointer">
                  <p className="font-medium text-xs">User Activity Report</p>
                  <p className="text-xs text-gray-500">Generated 1 week ago</p>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 w-full text-xs" onClick={() => {}}>View All Reports</Button>
              </div>
            </Card>

          </div>

          {/* MIDDLE COLUMN - Main Admin Content (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Stats Overview */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">System Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiUsers className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-900">Total Users</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-green-50 border-green-100">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiActivity className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-900">Active Users</p>
                      <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-red-50 border-red-100">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <FiAlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-red-900">Reported Content</p>
                      <p className="text-2xl font-bold text-red-600">{stats.reportedContent}</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-purple-50 border-purple-100">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FiShield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-900">System Health</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.systemHealth}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>

            {/* System Actions */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">System Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="secondary" fullWidth className="justify-between h-16" onClick={() => {}}>
                  <span>Manage Users</span>
                  <FiSettings />
                </Button>
                <Button variant="secondary" fullWidth className="justify-between h-16" onClick={() => {}}>
                  <span>Content Moderation</span>
                  <FiShield />
                </Button>
                <Button variant="secondary" fullWidth className="justify-between h-16" onClick={() => {}}>
                  <span>System Logs</span>
                  <FiActivity />
                </Button>
                <Button variant="secondary" fullWidth className="justify-between h-16" onClick={() => {}}>
                  <span>Backup System</span>
                  <FiTrendingUp />
                </Button>
              </div>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Recent System Alerts</h3>
              <div className="text-center py-8 text-neutral-500">
                <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FiShield className="text-green-500 w-8 h-8" />
                </div>
                <p className="text-lg font-medium text-neutral-900">All Systems Operational</p>
                <p className="text-neutral-500 mt-2">No critical alerts at this time.</p>
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN - News & Updates (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Today's News & Views */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">System Updates</h3>
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">System Update v2.4.1 Released</h4>
                  <p className="text-xs text-gray-500 mt-1">System News • 2h ago</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">Security Patch Applied</h4>
                  <p className="text-xs text-gray-500 mt-1">Security Team • 4h ago</p>
                </div>
                <div className="pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">Database Optimization Complete</h4>
                  <p className="text-xs text-gray-500 mt-1">DevOps • 6h ago</p>
                </div>
              </div>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">System Performance</h3>
                <p className="text-xs text-gray-600 mb-4">All systems running optimally</p>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Response Time</span>
                    <span className="text-xs font-bold text-green-600">45ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">CPU Usage</span>
                    <span className="text-xs font-bold text-blue-600">23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Memory</span>
                    <span className="text-xs font-bold text-purple-600">67%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Daily Logins</span>
                  <span className="font-bold text-blue-600">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Users Today</span>
                  <span className="font-bold text-green-600">+47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API Calls</span>
                  <span className="font-bold text-purple-600">8.2K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="font-bold text-red-600">0.02%</span>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
