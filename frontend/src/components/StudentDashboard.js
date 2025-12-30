import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobService, postService } from '../services/api';
import { FiBook, FiBriefcase, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jobsData, postsData] = await Promise.all([
        jobService.getJobs({ job_type: 'internship', limit: 5 }),
        postService.getPosts({ limit: 10 })
      ]);
      setInternships(jobsData);
      setPosts(postsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.first_name}!</h1>
        <p className="text-gray-600 mt-2">Continue your learning journey and explore opportunities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/applications')}
                className="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors border-2 border-primary-200"
              >
                <FiBriefcase className="w-6 h-6 text-primary-600" />
                <div>
                  <div className="font-medium text-primary-900">My Applications</div>
                  <div className="text-sm text-primary-700">View submitted applications</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/jobs')}
                className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FiBriefcase className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-medium">Find Internships</div>
                  <div className="text-sm text-gray-600">Explore opportunities</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/communities')}
                className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FiBook className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-medium">Learning Resources</div>
                  <div className="text-sm text-gray-600">Access courses & tutorials</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/communities')}
                className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <FiUsers className="w-6 h-6 text-purple-600" />
                <div>
                  <div className="font-medium">Connect with Peers</div>
                  <div className="text-sm text-gray-600">Build your network</div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Posts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Campus Feed</h2>
            {posts.length === 0 ? (
              <p className="text-gray-500">No posts yet. Be the first to share!</p>
            ) : (
              <div className="space-y-4">
                {posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      {post.user_picture ? (
                        <img
                          src={post.user_picture}
                          alt={post.user_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                          {post.user_name?.[0] || 'U'}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{post.user_name}</div>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </div>
                        <p className="text-gray-800 mt-2">{post.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Internship Opportunities */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Internship Opportunities</h3>
            {internships.length === 0 ? (
              <p className="text-gray-500 text-sm">No internships available right now.</p>
            ) : (
              <div className="space-y-4">
                {internships.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.company_name}</p>
                    <p className="text-sm text-gray-500">{job.location}</p>
                    <button 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Learning Goals */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Learning Goals</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Complete React Course</span>
                <span className="text-sm text-gray-500">60%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Build Portfolio Project</span>
                <span className="text-sm text-gray-500">30%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
