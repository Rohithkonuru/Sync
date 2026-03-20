import React, { useState, useEffect, useRef } from 'react';

import { useParams, Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { userService, postService } from '../services/api';

import { FiUserPlus, FiCheck, FiEdit2, FiBriefcase, FiBook, FiAward, FiMapPin, FiX, FiTrash2, FiTrendingUp, FiFileText, FiUpload, FiRefreshCw } from 'react-icons/fi';

import toast from 'react-hot-toast';
import SyncScore from '../components/SyncScore';



const Profile = () => {

  const { userId } = useParams();

  const { user: currentUser } = useAuth();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [isConnected, setIsConnected] = useState(false);

  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState('none'); // none, pending, connected

  const [atsScore, setAtsScore] = useState(null);

  const [loadingAtsScore, setLoadingAtsScore] = useState(false);

  const [uploadingResume, setUploadingResume] = useState(false);
  const [profilePosts, setProfilePosts] = useState([]);
  const [loadingProfilePosts, setLoadingProfilePosts] = useState(false);

  const resumeInputRef = useRef(null);



  useEffect(() => {

    loadProfile();

  }, [userId, currentUser]);



  useEffect(() => {

    if (user && isOwnProfile && ['student', 'professional', 'job_seeker'].includes(user.user_type)) {

      loadAtsScore();

    }

  }, [user, isOwnProfile]);

  useEffect(() => {

    if (user?.id || user?._id) {

      loadProfilePosts(user.id || user._id);

    }

  }, [user?.id, user?._id]);



  const loadProfile = async () => {

    try {

      const profileId = userId || currentUser?.id;

      if (!profileId) return;



      setIsOwnProfile(profileId === currentUser?.id);

      const data = await userService.getProfile(profileId);

      setUser(data);

      

      const isConnected = 

        currentUser?.connections?.includes(data.id) ||

        data.connections?.includes(currentUser?.id);

      const hasPending = 

        currentUser?.connection_requests?.includes(data.id) ||

        data.connection_requests?.includes(currentUser?.id);

      

      setIsConnected(isConnected);

      setHasPendingRequest(hasPending);

      setConnectionStatus(

        isConnected ? 'connected' : 

        hasPending ? 'pending' : 

        'none'

      );

    } catch (error) {

      toast.error('Failed to load profile');

    } finally {

      setLoading(false);

    }

  };



  const loadAtsScore = async () => {

    try {

      setLoadingAtsScore(true);

      const score = await userService.getAtsScore();

      setAtsScore(score);

    } catch (error) {

      console.error('Failed to load ATS score:', error);

      // ATS score might not be available yet

    } finally {

      setLoadingAtsScore(false);

    }

  };

  const loadProfilePosts = async (profileId) => {

    try {

      setLoadingProfilePosts(true);

      const feed = await postService.getFeed({ limit: 50, sort_by: 'recent' });

      const posts = (Array.isArray(feed) ? feed : []).filter(

        (post) => String(post.user_id) === String(profileId)

      );

      setProfilePosts(posts);

    } catch (error) {

      setProfilePosts([]);

    } finally {

      setLoadingProfilePosts(false);

    }

  };



  const handleConnect = async () => {

    try {

      await userService.sendConnectionRequest(user.id);

      toast.success('Connection request sent!');

      setConnectionStatus('pending');

      setHasPendingRequest(true);

    } catch (error) {

      const detail = error.response?.data?.detail;

      let msg = 'Failed to send connection request';

      if (typeof detail === 'string') msg = detail;

      else if (Array.isArray(detail)) msg = detail.map(e => e.msg || JSON.stringify(e)).join(', ');

      

      toast.error(msg);

    }

  };



  const handleResumeUpload = async (event) => {

    const file = event.target.files[0];

    if (!file) return;



    // Validate file type

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!allowedTypes.includes(file.type)) {

      toast.error('Please upload a PDF, DOC, or DOCX file');

      return;

    }



    // Validate file size (10MB max)

    if (file.size > 10 * 1024 * 1024) {

      toast.error('File size must be less than 10MB');

      return;

    }



    setUploadingResume(true);

    try {

      const formData = new FormData();

      formData.append('file', file);



      const response = await userService.uploadResume(formData);

      toast.success('Resume uploaded successfully! ATS score updated.');



      // Update ATS score immediately from response

      if (response.ats_score) {

        setAtsScore(response.ats_score);

      } else {

        // Fallback if not in response

        await loadAtsScore();

      }

    } catch (error) {

      // Handle different error formats

      let errorMessage = 'Failed to upload resume';

      if (error.response?.data) {

        if (typeof error.response.data === 'string') {

          errorMessage = error.response.data;

        } else if (error.response.data.detail) {

          errorMessage = error.response.data.detail;

        } else if (error.response.data.message) {

          errorMessage = error.response.data.message;

        } else if (Array.isArray(error.response.data)) {

          // Handle validation errors array

          errorMessage = error.response.data.map(err =>

            err.msg || err.message || 'Validation error'

          ).join(', ');

        }

      }

      toast.error(errorMessage);

    } finally {

      setUploadingResume(false);

      // Clear the input

      if (resumeInputRef.current) {

        resumeInputRef.current.value = '';

      }

    }

  };



  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>

      </div>

    );

  }



  if (!user) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <div className="text-gray-500">User not found</div>

      </div>

    );

  }



  return (

    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Banner */}

      <div className="relative h-64 bg-gradient-to-r from-primary-500 to-primary-700 rounded-t-lg overflow-hidden">

        {user.banner_picture && (

          <img src={user.banner_picture} alt="Banner" className="w-full h-full object-cover" />

        )}

      </div>



      {/* Profile Header */}

      <div className="bg-white rounded-b-lg shadow-md p-6 -mt-20 relative">

        <div className="flex flex-col md:flex-row md:items-end md:justify-between">

          <div className="flex items-end space-x-6">

            <div className="relative group">

              {user.profile_picture ? (

                <>

                  <img

                    src={user.profile_picture}

                    alt={user.first_name}

                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg"

                  />

                  {isOwnProfile && (

                    <button

                      onClick={async () => {

                        if (window.confirm('Are you sure you want to delete your profile photo?')) {

                          try {

                            await userService.deleteProfilePicture();

                            toast.success('Profile photo deleted');

                            loadProfile();

                          } catch (error) {

                            toast.error('Failed to delete profile photo');

                          }

                        }

                      }}

                      className="absolute -bottom-2 -right-2 p-2 bg-error-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-700"

                      title="Delete profile photo"

                    >

                      <FiTrash2 className="w-4 h-4" />

                    </button>

                  )}

                </>

              ) : (

                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-primary-600 flex items-center justify-center text-white text-4xl">

                  {user.first_name?.[0] || 'U'}

                </div>

              )}

            </div>

            <div>

            {/* Stats */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">

              <div className="bg-white rounded-lg shadow-md p-4 text-center">

                <p className="text-2xl font-bold text-primary-700">{user.connections?.length || 0}</p>

                <p className="text-sm text-gray-600">Connections</p>

              </div>

              <div className="bg-white rounded-lg shadow-md p-4 text-center">

                <p className="text-2xl font-bold text-primary-700">{user.profile_views || 0}</p>

                <p className="text-sm text-gray-600">Profile Views</p>

              </div>

              <div className="bg-white rounded-lg shadow-md p-4 text-center">

                <p className="text-2xl font-bold text-primary-700">{profilePosts.length}</p>

                <p className="text-sm text-gray-600">Posts</p>

              </div>

            </div>

              <h1 className="text-3xl font-bold">

                {user.first_name} {user.last_name}

              </h1>

              {user.headline && <p className="text-gray-600 mt-1">{user.headline}</p>}

              {user.location && (

                <div className="flex items-center text-gray-500 mt-2">

                  <FiMapPin className="w-4 h-4 mr-1" />

                  <span>{user.location}</span>

                </div>

              )}

              {/* Sync Score */}

              <div className="mt-4">

                <SyncScore userId={user.id} showTooltip={true} compact={false} />

              </div>

            </div>

          </div>

          <div className="mt-4 md:mt-0">

            {isOwnProfile ? (

              <Link

                to="/settings"

                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"

              >

                <FiEdit2 className="w-4 h-4" />

                <span>Edit Profile</span>

              </Link>

            ) : (

              connectionStatus === 'none' && (

                <button

                  onClick={handleConnect}

                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"

                >

                  <FiUserPlus className="w-4 h-4" />

                  <span>Connect</span>

                </button>

              )

            )}

            {connectionStatus === 'pending' && (

              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">

                Connection Request Pending

              </span>

            )}

            {connectionStatus === 'connected' && (

              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center space-x-2">

                <FiCheck className="w-4 h-4" />

                <span>Connected</span>

              </span>

            )}

          </div>

        </div>

      </div>



      {/* Content */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

        {/* Main Content */}

        <div className="lg:col-span-2 space-y-6">

          {/* About */}

          {user.bio && (

            <div className="bg-white rounded-lg shadow-md p-6">

              <h2 className="text-xl font-semibold mb-4">About</h2>

              <p className="text-gray-700">{user.bio}</p>

            </div>

          )}



          {/* Experience */}

          {user.experience && user.experience.length > 0 && (

            <div className="bg-white rounded-lg shadow-md p-6">

              <h2 className="text-xl font-semibold mb-4 flex items-center">

                <FiBriefcase className="w-5 h-5 mr-2" />

                Experience

              </h2>

              <div className="space-y-4">

                {user.experience.map((exp, idx) => (

                  <div key={idx} className="border-l-2 border-primary-500 pl-4">

                    <div className="font-semibold">{exp.title}</div>

                    <div className="text-gray-600">{exp.company}</div>

                    {exp.location && <div className="text-sm text-gray-500">{exp.location}</div>}

                    <div className="text-sm text-gray-500">

                      {exp.start_date} - {exp.current ? 'Present' : exp.end_date}

                    </div>

                    {exp.description && (

                      <div className="mt-2 text-gray-700">{exp.description}</div>

                    )}

                  </div>

                ))}

              </div>

            </div>

          )}



          {/* Education */}

          {user.education && user.education.length > 0 && (

            <div className="bg-white rounded-lg shadow-md p-6">

              <h2 className="text-xl font-semibold mb-4 flex items-center">

                <FiBook className="w-5 h-5 mr-2" />

                Education

              </h2>

              <div className="space-y-4">

                {user.education.map((edu, idx) => (

                  <div key={idx} className="border-l-2 border-primary-500 pl-4">

                    <div className="font-semibold">{edu.degree}</div>

                    <div className="text-gray-600">{edu.school}</div>

                    {edu.field && <div className="text-sm text-gray-500">{edu.field}</div>}

                    <div className="text-sm text-gray-500">

                      {edu.start_date} - {edu.end_date || 'Present'}

                    </div>

                  </div>

                ))}

              </div>

            </div>

          )}



          {/* Projects */}
          {user.projects && user.projects.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiBriefcase className="w-5 h-5 mr-2" />
                Projects
              </h2>
              <div className="space-y-4">
                {user.projects.map((project, idx) => (
                  <div key={idx} className="border-l-2 border-primary-500 pl-4">
                    <div className="font-semibold">{project.name}</div>
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm block">
                        {project.url}
                      </a>
                    )}
                    <div className="text-sm text-gray-500">
                      {project.start_date} - {project.end_date || 'Present'}
                    </div>
                    {project.description && (
                      <div className="mt-2 text-gray-700">{project.description}</div>
                    )}
                    {project.tools && project.tools.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {project.tools.map((tool, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}

          {user.certifications && user.certifications.length > 0 && (

            <div className="bg-white rounded-lg shadow-md p-6">

              <h2 className="text-xl font-semibold mb-4 flex items-center">

                <FiAward className="w-5 h-5 mr-2" />

                Certifications

              </h2>

              <div className="space-y-4">

                {user.certifications.map((cert, idx) => (

                  <div key={idx} className="border-l-2 border-primary-500 pl-4">

                    <div className="font-semibold">{cert.name}</div>

                    <div className="text-gray-600">{cert.issuer}</div>

                    {cert.issue_date && (

                      <div className="text-sm text-gray-500">

                        Issued: {cert.issue_date}

                      </div>

                    )}

                  </div>

                ))}

              </div>

            </div>

          )}

          {/* Posts */}

          <div className="bg-white rounded-lg shadow-md p-6">

            <h2 className="text-xl font-semibold mb-4">Posts</h2>

            {loadingProfilePosts ? (

              <div className="text-sm text-gray-500">Loading posts...</div>

            ) : profilePosts.length === 0 ? (

              <div className="text-sm text-gray-500">No posts published yet.</div>

            ) : (

              <div className="space-y-3">

                {profilePosts.slice(0, 10).map((post) => (

                  <div key={post.id || post._id} className="border border-gray-100 rounded-lg p-3">

                    <p className="text-sm text-gray-800 break-words">{post.content || 'Media post'}</p>

                    {post.media_url && post.media_type === 'image' && (

                      <img

                        src={post.media_url}

                        alt="Post media"

                        className="w-full h-auto rounded-lg object-cover mt-2"

                      />

                    )}

                    {post.media_url && post.media_type === 'video' && (

                      <video controls className="w-full rounded-lg mt-2">

                        <source src={post.media_url} />

                      </video>

                    )}

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>



        {/* Sidebar */}

        <div className="space-y-6">

          {/* ATS Score - Only for own profile and student/professional/job_seeker */}

          {isOwnProfile && ['student', 'professional', 'job_seeker'].includes(user.user_type) && (

            <div className="bg-white rounded-lg shadow-md p-6">

              <div className="flex items-center justify-between mb-4">

                <div className="flex items-center space-x-2">

                  <FiTrendingUp className="w-5 h-5 text-primary-600" />

                  <h3 className="font-semibold">ATS Score</h3>

                </div>

                <div className="flex space-x-2">

                  <input

                    ref={resumeInputRef}

                    type="file"

                    accept=".pdf,.doc,.docx"

                    onChange={handleResumeUpload}

                    className="hidden"

                    disabled={uploadingResume}

                  />

                  <button

                    onClick={() => resumeInputRef.current?.click()}

                    disabled={uploadingResume}

                    className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-1"

                    title="Upload resume for ATS scoring"

                  >

                    {uploadingResume ? (

                      <FiRefreshCw className="w-4 h-4 animate-spin" />

                    ) : atsScore ? (

                      <FiRefreshCw className="w-4 h-4" />

                    ) : (

                      <FiUpload className="w-4 h-4" />

                    )}

                    <span>{uploadingResume ? 'Uploading...' : atsScore ? 'Update' : 'Upload'}</span>

                  </button>

                </div>

              </div>

              {loadingAtsScore ? (

                <div className="flex justify-center py-4">

                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>

                </div>

              ) : atsScore ? (

                <div>

                  <div className="flex items-center justify-between mb-2">

                    <span className="text-lg font-medium text-gray-700">ATS Friendly Score</span>

                    <div className="flex items-baseline">

                      <span className="text-3xl font-bold text-primary-600">{atsScore.score || 0}%</span>

                    </div>

                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">

                    <div

                      className={`h-3 rounded-full ${

                        (atsScore.score || 0) >= 80

                          ? 'bg-green-500'

                          : (atsScore.score || 0) >= 60

                          ? 'bg-yellow-500'

                          : 'bg-red-500'

                      }`}

                      style={{ width: `${atsScore.score || 0}%` }}

                    ></div>

                  </div>

                  {atsScore.verified && (

                    <div className="flex items-center space-x-1 text-sm text-green-600 mb-2">

                      <FiCheck className="w-4 h-4" />

                      <span>Resume Verified</span>

                    </div>

                  )}

                  {atsScore.last_updated && (

                    <p className="text-xs text-gray-500 mt-4">

                      Last updated: {new Date(atsScore.last_updated).toLocaleDateString()}

                    </p>

                  )}

                </div>

              ) : (

                <div className="text-center py-4">

                  <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />

                  <p className="text-sm text-gray-500">Upload resume to get ATS score</p>

                </div>

              )}

            </div>

          )}



          {/* Skills */}

          {user.skills && user.skills.length > 0 && (

            <div className="bg-white rounded-lg shadow-md p-6">

              <h3 className="font-semibold mb-4">Skills</h3>

              <div className="flex flex-wrap gap-2">

                {user.skills.map((skill, idx) => (

                  <span

                    key={idx}

                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"

                  >

                    {skill}

                  </span>

                ))}

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

};



export default Profile;



