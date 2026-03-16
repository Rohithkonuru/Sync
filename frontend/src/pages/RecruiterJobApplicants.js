import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService } from '../services/api';
import { FiArrowLeft, FiUser, FiEye, FiCheckCircle, FiXCircle, FiClock, FiBriefcase, FiFilter } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const normalizeStatus = (status) => {
  const value = (status || '').toLowerCase().trim();
  if (value === 'under_review') return 'seen';
  if (value === 'in_processing') return 'in-processing';
  return value || 'submitted';
};

const getSyncScore = (applicant) => {
  const raw = applicant?.sync_score ?? applicant?.applicant?.sync_score ?? 0;
  return Number.isFinite(Number(raw)) ? Math.round(Number(raw)) : 0;
};

const getAtsScore = (applicant) => {
  const direct = applicant?.ats_score;
  if (typeof direct === 'number') return Math.round(direct);
  const nested = applicant?.applicant?.ats_score?.score;
  if (typeof nested === 'number') return Math.round(nested);
  return 0;
};

const formatStatusLabel = (status) => {
  const s = normalizeStatus(status);
  const labels = {
    submitted: 'Submitted',
    seen: 'Seen',
    'in-processing': 'In Process',
    shortlisted: 'Shortlisted',
    accepted: 'Accepted',
    rejected: 'Rejected',
  };
  return labels[s] || 'Submitted';
};

const getStatusClass = (status) => {
  const s = normalizeStatus(status);
  const map = {
    submitted: 'bg-blue-100 text-blue-700',
    seen: 'bg-indigo-100 text-indigo-700',
    'in-processing': 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-green-100 text-green-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[s] || 'bg-gray-100 text-gray-700';
};

const RecruiterJobApplicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  useEffect(() => {
    if (jobId) {
      loadJobData();
      loadApplicants();
    }
  }, [jobId]);

  const loadJobData = async () => {
    try {
      const data = await jobService.getJob(jobId);
      setJob(data);
    } catch (error) {
      console.error('Error loading job:', error);
      toast.error('Failed to load job details');
    }
  };

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const data = await jobService.getRecruiterJobApplications(jobId);
      setApplicants(data || []);
    } catch (error) {
      console.error('Error loading applicants:', error);
      toast.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (applicant) => {
    try {
      // Mark as seen if not already seen
      if (!applicant.is_seen) {
        await jobService.markApplicationAsSeen(applicant.application_id);
        // Update local state
        setApplicants(prev => 
          prev.map(app => 
            app.application_id === applicant.application_id 
              ? { ...app, is_seen: true, status: normalizeStatus(app.status) === 'submitted' ? 'seen' : normalizeStatus(app.status) }
              : app
          )
        );
      }
      setSelectedApplicant(applicant);
    } catch (error) {
      toast.error('Failed to view profile');
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus, note = '') => {
    try {
      setUpdatingStatus(true);
      await jobService.updateApplicationStatus(applicationId, normalizeStatus(newStatus), note);
      
      // Update local state
      setApplicants(prev => 
        prev.map(app => 
          app.application_id === applicationId 
            ? { ...app, status: normalizeStatus(newStatus) }
            : app
        )
      );

      setSelectedApplicant((prev) => (
        prev && prev.application_id === applicationId
          ? { ...prev, status: normalizeStatus(newStatus) }
          : prev
      ));
      
      toast.success(`Application marked as ${formatStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredApplicants = applicants.filter(applicant => {
    if (filterStatus === 'all') return true;
    return normalizeStatus(applicant.status) === normalizeStatus(filterStatus);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          
          {job && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-2">
                {job.location} • {job.job_type} • {applicants.length} Applicants
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <FiFilter className="text-gray-500" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({applicants.length})
            </button>
            <button
              onClick={() => setFilterStatus('submitted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'submitted'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              New ({applicants.filter(a => a.status === 'submitted').length})
            </button>
            <button
              onClick={() => setFilterStatus('seen')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'seen'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Seen ({applicants.filter(a => normalizeStatus(a.status) === 'seen').length})
            </button>
            <button
              onClick={() => setFilterStatus('in-processing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'in-processing'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              In Process ({applicants.filter(a => normalizeStatus(a.status) === 'in-processing').length})
            </button>
            <button
              onClick={() => setFilterStatus('shortlisted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'shortlisted'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Shortlisted ({applicants.filter(a => a.status === 'shortlisted').length})
            </button>
          </div>
        </div>

        {/* Applicants List */}
        <div className="space-y-4">
          {filteredApplicants.length > 0 ? (
            filteredApplicants.map((applicant) => (
              <div key={applicant.application_id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {applicant.profile_picture ? (
                        <img
                          src={applicant.profile_picture}
                          alt={applicant.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <FiUser className="text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{applicant.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(applicant.status)}`}>
                          {formatStatusLabel(applicant.status)}
                        </span>
                        {!applicant.is_seen && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mt-1">{applicant.headline}</p>
                      <p className="text-gray-500 text-sm mt-1">{applicant.location}</p>
                      
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">Sync Score:</span>
                          <span className="text-sm font-bold text-purple-600">{getSyncScore(applicant)}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">ATS Score:</span>
                          <span className="text-sm font-bold text-green-600">{getAtsScore(applicant)}%</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <FiClock className="w-4 h-4" />
                          <span className="text-sm">
                            Applied {formatDistanceToNow(new Date(applicant.applied_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewProfile(applicant)}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <FiEye className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>
                    
                    {normalizeStatus(applicant.status) !== 'shortlisted' && normalizeStatus(applicant.status) !== 'accepted' && (
                      <button
                        onClick={() => handleStatusUpdate(applicant.application_id, 'in-processing', 'Application moved to in process')}
                        disabled={updatingStatus}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                      >
                        <FiClock className="w-4 h-4" />
                        <span>In Process</span>
                      </button>
                    )}

                    {normalizeStatus(applicant.status) !== 'shortlisted' && normalizeStatus(applicant.status) !== 'accepted' && (
                      <button
                        onClick={() => handleStatusUpdate(applicant.application_id, 'shortlisted', 'Candidate shortlisted by recruiter')}
                        disabled={updatingStatus}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        <span>Shortlist</span>
                      </button>
                    )}
                    
                    {normalizeStatus(applicant.status) !== 'rejected' && (
                      <button
                        onClick={() => handleStatusUpdate(applicant.application_id, 'rejected', 'Candidate rejected by recruiter')}
                        disabled={updatingStatus}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        <FiXCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FiBriefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applicants found</h3>
              <p className="text-gray-500">
                {filterStatus === 'all' 
                  ? "No one has applied to this job yet." 
                  : `No applicants with status "${filterStatus.replace('_', ' ')}".`}
              </p>
            </div>
          )}
        </div>

        {/* Applicant Detail Modal */}
        {selectedApplicant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Applicant Profile</h2>
                  <button
                    onClick={() => setSelectedApplicant(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiXCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {selectedApplicant.profile_picture ? (
                      <img
                        src={selectedApplicant.profile_picture}
                        alt={selectedApplicant.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <FiUser className="text-gray-500 text-xl" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedApplicant.name}</h3>
                      <p className="text-gray-600">{selectedApplicant.headline}</p>
                      <p className="text-gray-500 text-sm">{selectedApplicant.location}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Sync Score</h4>
                      <div className="text-2xl font-bold text-purple-600">{getSyncScore(selectedApplicant)}%</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">ATS Score</h4>
                      <div className="text-2xl font-bold text-green-600">{getAtsScore(selectedApplicant)}%</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-700">
                    Current Status: <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(selectedApplicant.status)}`}>{formatStatusLabel(selectedApplicant.status)}</span>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button
                      onClick={() => handleStatusUpdate(selectedApplicant.application_id, 'in-processing', 'Application moved to in process')}
                      disabled={updatingStatus || normalizeStatus(selectedApplicant.status) === 'in-processing'}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                      In Process
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedApplicant.application_id, 'shortlisted', 'Candidate shortlisted by recruiter')}
                      disabled={updatingStatus || normalizeStatus(selectedApplicant.status) === 'shortlisted' || normalizeStatus(selectedApplicant.status) === 'accepted'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedApplicant.application_id, 'rejected', 'Candidate rejected by recruiter')}
                      disabled={updatingStatus || normalizeStatus(selectedApplicant.status) === 'rejected'}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterJobApplicants;
