import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService, postService } from '../../services/api';
import { Button, Card, Badge, ProgressBar } from '../ui';
import { 
  FiBriefcase, 
  FiBookOpen, 
  FiAward, 
  FiFileText, 
  FiEdit2, 
  FiPlus, 
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiUser,
  FiRefreshCw,
  FiUpload,
  FiTrendingUp,
  FiCheck
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import PostComposer from '../PostComposer';

/**
 * Student Dashboard
 * Focused on: Learning, Career Preparation, Internships
 */
const StudentDashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  
  // Mock Data for Student Specifics
  const [education, setEducation] = useState([
    {
      school: 'University of Technology',
      degree: 'Bachelor of Science in Computer Science',
      year: '2022 - 2026',
      gpa: '3.8/4.0'
    }
  ]);
  
  const [learningResources, setLearningResources] = useState([
    { id: 1, title: 'Data Structures & Algorithms', provider: 'Internal', progress: 65 },
    { id: 2, title: 'React.js Fundamentals', provider: 'Internal', progress: 30 },
    { id: 3, title: 'Interview Preparation Guide', provider: 'Internal', progress: 0 },
  ]);

  const [skills, setSkills] = useState(['JavaScript', 'Python', 'React', 'HTML/CSS']);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const [certifications, setCertifications] = useState([
    { id: 1, name: 'AWS Cloud Practitioner', date: '2023', issuer: 'Amazon' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Parallel data fetching
      const [internshipData, applicationData, postsData] = await Promise.all([
        jobService.getJobs({ job_type: 'internship', limit: 5 }).catch(() => []),
        jobService.getApplications({ limit: 5 }).catch(() => []),
        postService.getPosts({ limit: 10, include_demo: true }).catch(() => [])
      ]);

      setInternships(internshipData);
      setApplications(applicationData);
      setFeedPosts(postsData);
      
    } catch (error) {
      console.error('Error loading student dashboard:', error);
      if (error.response?.status === 503) {
        toast.error('Service Unavailable: Database not connected');
      } else {
        toast.error('Failed to load some dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      const newPost = await postService.createPost(postData);
      setFeedPosts(prev => [newPost, ...prev]);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      // Error is handled/displayed by PostComposer mostly, but we catch here too
      throw error; // Re-throw to let PostComposer handle UI feedback if needed
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
      toast.success('Skill added');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'shortlisted': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'accepted': return 'text-green-700 bg-green-100';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ATS Score & Resume Launchpad */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="w-5 h-5 text-blue-200" />
                <h2 className="text-2xl font-bold">Student Career Launchpad</h2>
              </div>
              
              {loadingAtsScore ? (
                <div className="w-full max-w-md h-2 bg-blue-500/30 rounded-full animate-pulse my-4"></div>
              ) : atsScore ? (
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-blue-100">Resume Strength:</span>
                    <span className={`font-bold text-xl ${
                      (atsScore.score || 0) >= 80 ? 'text-green-300' : 
                      (atsScore.score || 0) >= 60 ? 'text-yellow-300' : 'text-red-300'
                    }`}>
                      {atsScore.score || 0}%
                    </span>
                    {atsScore.verified && (
                      <div className="flex items-center gap-1 text-xs text-green-300 border border-green-300/30 px-2 py-0.5 rounded-full">
                        <FiCheck className="w-3 h-3" /> Verified
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            (atsScore.score || 0) >= 80 ? 'bg-green-400' : 
                            (atsScore.score || 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} 
                          style={{ width: `${atsScore.score || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-blue-100 mb-4">Upload your resume to unlock your ATS score and exclusive internship opportunities.</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
                disabled={uploadingResume}
              />
              <Button 
                variant="white" 
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
                className="flex items-center gap-2"
              >
                {uploadingResume ? (
                  <>
                    <FiRefreshCw className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload /> {atsScore ? 'Update Resume' : 'Upload Resume'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="text-white border-white hover:bg-white/10"
                onClick={() => navigate('/profile')}
              >
                Complete Profile
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN - Personal & Academic (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Profile Summary */}
            <Card>
              <div className="text-center">
                <div className="relative inline-block">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt={user.first_name} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto border-4 border-white shadow-sm">
                      <FiUser className="w-10 h-10 text-blue-500" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{user.first_name} {user.last_name}</h3>
                <p className="text-sm text-gray-500">{user.headline || 'Student'}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">Student</Badge>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700">Open to Internships</Badge>
                </div>
              </div>
            </Card>

            {/* Education Details */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiBookOpen className="text-blue-500" /> Education
                </h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm">Edit</button>
              </div>
              <div className="space-y-4">
                {education.map((edu, idx) => (
                  <div key={idx} className="relative pl-4 border-l-2 border-gray-100">
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
                    <h4 className="font-medium text-gray-900">{edu.school}</h4>
                    <p className="text-sm text-gray-600">{edu.degree}</p>
                    <p className="text-xs text-gray-500 mt-1">{edu.year} • GPA: {edu.gpa}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Skills (Editable) */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiAward className="text-purple-500" /> Skills
                </h3>
                <button 
                  onClick={() => setIsEditingSkills(!isEditingSkills)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  {isEditingSkills ? 'Done' : 'Edit'}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700">
                    {skill}
                    {isEditingSkills && (
                      <button onClick={() => handleRemoveSkill(skill)} className="ml-1 text-gray-400 hover:text-red-500">
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>

              {isEditingSkills && (
                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add skill..."
                    className="flex-1 text-sm border rounded px-2 py-1"
                  />
                  <button type="submit" className="text-blue-600 text-sm font-medium">Add</button>
                </form>
              )}
            </Card>

            {/* Certifications Upload */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiAward className="text-yellow-500" /> Certifications
                </h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm">
                  <FiPlus />
                </button>
              </div>
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="bg-white p-1.5 rounded shadow-sm">
                      <FiAward className="text-yellow-600 w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                      <p className="text-xs text-gray-500">{cert.issuer} • {cert.date}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" fullWidth className="text-gray-500 text-xs border-dashed border">
                  + Upload Certificate
                </Button>
              </div>
            </Card>

          </div>

          {/* MIDDLE COLUMN - Feed & Learning (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Learning Resources */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Learning Progress</h3>
                <a href="#" className="text-sm text-blue-600 hover:underline">View Library</a>
              </div>
              <div className="space-y-4">
                {learningResources.map((res) => (
                  <div key={res.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{res.title}</span>
                      <span className="text-gray-500">{res.progress}%</span>
                    </div>
                    <ProgressBar value={res.progress} color="blue" showLabel={false} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Create Post */}
            <PostComposer onSubmit={handleCreatePost} placeholder="Share your learning journey or ask a question..." />

            {/* Feed */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Student Community</h3>
              <AnimatePresence>
                {feedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="mb-4">
                      {/* Post Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={post.user_picture || `https://ui-avatars.com/api/?name=${post.user_name}&background=random`} 
                          alt={post.user_name} 
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{post.user_name}</h4>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(post.created_at || Date.now()), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>
                      
                      {/* Images */}
                      {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {post.images.map((img, i) => (
                            <img key={i} src={img} alt="Post" className="rounded-lg w-full h-48 object-cover" />
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <button className="text-gray-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1">
                          Like ({post.likes?.length || 0})
                        </button>
                        <button className="text-gray-500 hover:text-blue-600 text-sm font-medium">
                          Comment
                        </button>
                        <button className="text-gray-500 hover:text-blue-600 text-sm font-medium">
                          Share
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN - Opportunities (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Internship Opportunities */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Internships</h3>
                <a href="#" className="text-sm text-blue-600 hover:underline">View All</a>
              </div>
              <div className="space-y-4">
                {internships.length > 0 ? internships.map((job) => (
                  <div key={job.id} className="p-3 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <h4 className="font-semibold text-gray-900 text-sm">{job.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{job.company_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Internship</Badge>
                      <span className="text-[10px] text-gray-400">{job.location || 'Remote'}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No internships found.</p>
                )}
              </div>
            </Card>

            {/* Application Status */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">My Applications</h3>
              </div>
              <div className="space-y-3">
                {applications.length > 0 ? applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{app.job_title}</p>
                      <p className="text-xs text-gray-500 truncate">{app.company_name}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-6">
                    <div className="bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <FiFileText className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No active applications</p>
                    <Button variant="text" size="sm" className="text-blue-600 mt-1">Start Applying</Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Notifications (Mock) */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-3">
                <div className="flex gap-3 text-sm">
                  <div className="mt-1"><FiCheckCircle className="text-green-500" /></div>
                  <div>
                    <p className="text-gray-900">Your application to <span className="font-medium">TechCorp</span> was viewed.</p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="mt-1"><FiClock className="text-orange-500" /></div>
                  <div>
                    <p className="text-gray-900">Reminder: Complete your Python certification.</p>
                    <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardEnhanced;
