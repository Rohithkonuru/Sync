import React, { useState, useEffect, useMemo } from 'react';
import { jobService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import ApplicationsList from '../components/ApplicationsList';
import { FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';

const normalizeStatus = (status) => {
  const value = (status || '').toLowerCase().trim();
  if (value === 'under_review') return 'seen';
  if (value === 'in_processing') return 'in-processing';
  return value || 'submitted';
};

const MyApplications = () => {
  const { socket, isConnected } = useSocket();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      // Listen for application status updates
      socket.on('application_status_update', (data) => {
        const { application_id, status } = data;
        setApplications((prev) =>
          prev.map((app) => {
            if (app.id === application_id) {
              toast.success(`Application status updated to ${status}`);
              return { ...app, status: normalizeStatus(status), updated_at: new Date().toISOString() };
            }
            return app;
          })
        );
      });

      return () => {
        socket.off('application_status_update');
      };
    }
  }, [socket, isConnected]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await jobService.getApplications({ limit: 50 });
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const companySummaries = useMemo(() => {
    const summaryMap = new Map();

    applications.forEach((app) => {
      const companyName = app?.job?.company_name || app?.company_name || 'Unknown Company';
      const status = normalizeStatus(app?.status);
      const existing = summaryMap.get(companyName) || {
        companyName,
        total: 0,
        submitted: 0,
        seen: 0,
        'in-processing': 0,
        shortlisted: 0,
        accepted: 0,
        rejected: 0,
      };
      existing.total += 1;
      existing[status] = (existing[status] || 0) + 1;
      summaryMap.set(companyName, existing);
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.total - a.total);
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const companyName = app?.job?.company_name || app?.company_name || 'Unknown Company';
      const status = normalizeStatus(app?.status);

      const companyMatch = selectedCompany === 'all' || companyName === selectedCompany;
      const statusMatch = selectedStatus === 'all' || status === selectedStatus;

      return companyMatch && statusMatch;
    });
  }, [applications, selectedCompany, selectedStatus]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-gray-800 mt-2">Track your application status by company</p>
      </div>

      {/* Company-wise status summary */}
      {companySummaries.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-gray-800">
            <FiBriefcase className="w-4 h-4" />
            <h2 className="text-lg font-semibold">Status by Company</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {companySummaries.map((summary) => (
              <button
                key={summary.companyName}
                onClick={() => setSelectedCompany(summary.companyName)}
                className={`text-left bg-white border rounded-xl p-4 transition shadow-sm hover:shadow-md ${
                  selectedCompany === summary.companyName ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200'
                }`}
              >
                <div className="font-semibold text-gray-900 truncate">{summary.companyName}</div>
                <div className="text-xs text-gray-600 mt-1">{summary.total} application(s)</div>
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  {summary.shortlisted > 0 && <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">Shortlisted {summary.shortlisted}</span>}
                  {summary.accepted > 0 && <span className="px-2 py-1 rounded bg-green-100 text-green-700">Accepted {summary.accepted}</span>}
                  {summary.rejected > 0 && <span className="px-2 py-1 rounded bg-red-100 text-red-700">Rejected {summary.rejected}</span>}
                  {summary['in-processing'] > 0 && <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">In Process {summary['in-processing']}</span>}
                  {summary.seen > 0 && <span className="px-2 py-1 rounded bg-purple-100 text-purple-700">Seen {summary.seen}</span>}
                  {summary.submitted > 0 && <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">Submitted {summary.submitted}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <button
          onClick={() => setSelectedCompany('all')}
          className={`px-3 py-1.5 text-sm rounded-lg ${selectedCompany === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}
        >
          All Companies
        </button>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="seen">Seen</option>
          <option value="in-processing">In Processing</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>

        <span className="text-sm text-gray-600">Showing {filteredApplications.length} application(s)</span>
      </div>

      <ApplicationsList
        applications={filteredApplications}
        onDownloadResume={async (applicationId) => {
          try {
            const blob = await jobService.downloadResume(applicationId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `resume_${applicationId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Resume downloaded');
          } catch (error) {
            toast.error('Failed to download resume');
          }
        }}
        showTimeline={true}
      />
    </div>
  );
};

export default MyApplications;

