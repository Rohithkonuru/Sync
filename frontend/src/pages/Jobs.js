import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../services/api';
import { FiBriefcase, FiMapPin, FiDollarSign, FiClock, FiSend, FiX, FiBookmark } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import EnhancedApplicationForm from '../components/EnhancedApplicationForm';

const Jobs = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    title: '',
    location: '',
    job_type: '',
  });
  const [applying, setApplying] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadSingleJob();
    } else {
      loadJobs();
    }
  }, [filters, jobId]);

  const loadSingleJob = async () => {
    try {
      setLoading(true);
      const data = await jobService.getJob(jobId);
      setSelectedJob(data);
    } catch (error) {
      toast.error('Failed to load job details');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await jobService.getJobs(filters);
      setJobs(data);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuccess = async () => {
    setShowApplyModal(false);
    setSelectedJob(null);
    if (jobId) {
      await loadSingleJob();
    } else {
      await loadJobs();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // If viewing a single job
  if (jobId && selectedJob) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/jobs')}
          className="text-primary-600 hover:text-primary-700 mb-4"
        >
          ← Back to Jobs
        </button>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">{selectedJob.title}</h1>
              <p className="text-xl text-gray-600 mt-2">{selectedJob.company_name}</p>
              <div className="flex items-center space-x-4 mt-4 text-gray-600">
                <div className="flex items-center">
                  <FiMapPin className="w-4 h-4 mr-1" />
                  <span>{selectedJob.location}</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="w-4 h-4 mr-1" />
                  <span className="capitalize">{selectedJob.job_type}</span>
                </div>
                {(selectedJob.salary_min || selectedJob.salary_max) && (
                  <div className="flex items-center">
                    <FiDollarSign className="w-4 h-4 mr-1" />
                    <span>
                      {selectedJob.salary_min && selectedJob.salary_max
                        ? `$${selectedJob.salary_min.toLocaleString()} - $${selectedJob.salary_max.toLocaleString()}`
                        : selectedJob.salary_min
                        ? `$${selectedJob.salary_min.toLocaleString()}+`
                        : `Up to $${selectedJob.salary_max.toLocaleString()}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => jobService.saveJob(selectedJob.id)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Save Job"
              >
                <FiBookmark className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
            </div>

            {selectedJob.requirements && selectedJob.requirements.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {selectedJob.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedJob.benefits && selectedJob.benefits.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Benefits</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {selectedJob.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={() => setShowApplyModal(true)}
                disabled={applying === selectedJob.id || user?.user_type === 'recruiter'}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FiSend className="w-5 h-5" />
                <span>{applying === selectedJob.id ? 'Applying...' : 'Apply Now'}</span>
              </button>
            </div>
          </div>
        </div>

        {showApplyModal && selectedJob && (
          <EnhancedApplicationForm
            jobId={selectedJob.id || selectedJob._id}
            jobTitle={selectedJob.title}
            onClose={() => {
              setShowApplyModal(false);
              setSelectedJob(null);
            }}
            onSuccess={handleApplySuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={filters.title}
                  onChange={(e) => handleFilterChange('title', e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="City, State"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={filters.job_type}
                  onChange={(e) => handleFilterChange('job_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold mb-6">Job Opportunities</h1>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No jobs found. Try adjusting your filters.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {job.company_logo && (
                          <img
                            src={job.company_logo}
                            alt={job.company_name}
                            className="w-12 h-12 rounded"
                          />
                        )}
                        <div>
                          <h3 className="text-xl font-semibold">{job.title}</h3>
                          <p className="text-gray-600">{job.company_name}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-4 text-gray-600">
                        <div className="flex items-center">
                          <FiMapPin className="w-4 h-4 mr-1" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center">
                          <FiClock className="w-4 h-4 mr-1" />
                          <span className="capitalize">{job.job_type || 'Full-time'}</span>
                        </div>
                        {(job.salary_min || job.salary_max) && (
                          <div className="flex items-center">
                            <FiDollarSign className="w-4 h-4 mr-1" />
                            <span>
                              {job.salary_min && job.salary_max
                                ? `$${Number(job.salary_min).toLocaleString()} - $${Number(job.salary_max).toLocaleString()}`
                                : job.salary_min
                                ? `$${Number(job.salary_min).toLocaleString()}+`
                                : `Up to $${Number(job.salary_max).toLocaleString()}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="mt-4 text-gray-700 line-clamp-2">{job.description}</p>

                      {job.requirements && job.requirements.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Requirements:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {job.requirements.slice(0, 3).map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4 text-sm text-gray-500">
                        Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowApplyModal(true);
                        }}
                        disabled={applying === job.id || user?.user_type === 'recruiter'}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50"
                      >
                        <FiSend className="w-4 h-4" />
                        <span>{applying === job.id ? 'Applying...' : 'Apply Now'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showApplyModal && selectedJob && (
        <EnhancedApplicationForm
          jobId={selectedJob.id || selectedJob._id}
          jobTitle={selectedJob.title}
          onClose={() => {
            setShowApplyModal(false);
            setSelectedJob(null);
          }}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
};


export default Jobs;

