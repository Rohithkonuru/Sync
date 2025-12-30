import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { postService, userService, jobService } from '../../../services/api';
import { Card, Button } from '../../ui';
import { FiEye, FiTrendingUp, FiBriefcase, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Shared Components
import ProfileCard from '../shared/ProfileCard';
import StatsCard from '../shared/StatsCard';
import SkillsWidget from '../shared/SkillsWidget';
import JobRecommendationsWidget from '../shared/JobRecommendationsWidget';

// We might want to reuse PostComposer and Feed logic here, but for now we keep it simple or import if available
// Assuming PostComposer is available in components
import PostComposer from '../../PostComposer';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const ProfessionalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    profileViews: 1247,
    connections: 1523,
    searchAppearances: 156,
  });
  const [posts, setPosts] = useState([]);
  const [industryJobs, setIndustryJobs] = useState([]);
  const [skills, setSkills] = useState(['React', 'Node.js', 'System Design']);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postsData, jobsData] = await Promise.all([
        postService.getPosts({ limit: 10 }).catch(() => []),
        jobService.getJobs({ limit: 5 }).catch(() => []), // Should be industry specific ideally
      ]);

      setPosts(postsData);
      setIndustryJobs(jobsData);
    } catch (error) {
      console.error('Error loading professional dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      const newPost = await postService.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard 
            title="Profile Views" 
            value={stats.profileViews} 
            trend="+12% this week" 
            icon={FiEye} 
            color="green" 
          />
          <StatsCard 
            title="Connections" 
            value={stats.connections} 
            trend="+5 new" 
            icon={FiUsers} 
            color="blue" 
          />
          <StatsCard 
            title="Search Appearances" 
            value={stats.searchAppearances} 
            icon={FiTrendingUp} 
            color="purple" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Profile & Skills */}
          <div className="lg:col-span-3 space-y-6">
            <ProfileCard user={user} badges={[{ label: 'Professional', className: 'bg-green-50 text-green-700' }]} />
            <SkillsWidget skills={skills} editable={true} onAddSkill={() => {}} onRemoveSkill={() => {}} />
            
            {/* Experience Summary (Mock for now) */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Experience</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1"><FiBriefcase className="text-gray-400" /></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Senior Engineer</h4>
                    <p className="text-sm text-gray-600">TechCorp • 2021 - Present</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Middle Column - Feed */}
          <div className="lg:col-span-6 space-y-6">
            <PostComposer onSubmit={handleCreatePost} placeholder="Share your professional insights..." />
            
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="mb-4">
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
                  <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>
                  {/* Image/Actions omitted for brevity but can be added */}
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column - Industry Jobs & News */}
          <div className="lg:col-span-3 space-y-6">
            <JobRecommendationsWidget jobs={industryJobs} title="Jobs in your Industry" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
