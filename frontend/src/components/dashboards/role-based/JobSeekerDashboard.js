import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { jobService, postService } from '../../../services/api';
import { Button, Card, ProgressBar, Input } from '../../ui';
import { FiSearch, FiMapPin, FiBookmark, FiBriefcase } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Shared Components
import ProfileCard from '../shared/ProfileCard';
import SkillsWidget from '../shared/SkillsWidget';
import ApplicationStatusWidget from '../shared/ApplicationStatusWidget';
import JobRecommendationsWidget from '../shared/JobRecommendationsWidget';
import StatsCard from '../shared/StatsCard';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  
  // Mock Data
  const [profileStrength, setProfileStrength] = useState(85);
  const [skills, setSkills] = useState(['JavaScript', 'Python', 'React', 'HTML/CSS']);
  const [interviewSchedule, setInterviewSchedule] = useState([
    { id: 1, company: 'Innovate Tech', role: 'Frontend Dev', date: 'Tomorrow, 10:00 AM', type: 'Video' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsData, appsData, savedData] = await Promise.all([
        jobService.getJobs({ limit: 5 }).catch(() => []),
        jobService.getApplications({ limit: 5 }).catch(() => []),
        jobService.getSavedJobs?.().catch(() => []) || [],
      ]);

      setRecommendedJobs(jobsData);
      setApplications(appsData);
      setSavedJobs(savedData);
    } catch (error) {
      console.error('Error loading job seeker dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    navigate(`/jobs?search=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Strength Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Profile Strength</h2>
              <span className="text-orange-600 font-bold">{profileStrength}%</span>
            </div>
            <ProgressBar value={profileStrength} color="orange" showLabel={false} className="h-3" />
            <p className="text-sm text-gray-500 mt-2">Add 2 more projects to reach All-Star status.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/profile')}>
              Manage Resume
            </Button>
            <Button variant="primary" theme="orange" onClick={() => navigate('/profile/edit')}>
              Update Skills
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Search & Saved */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Find Jobs</h3>
              <div className="space-y-3">
                <Input 
                  placeholder="Job title, keywords..." 
                  icon={FiSearch} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Input 
                  placeholder="Location" 
                  icon={FiMapPin} 
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
                <Button fullWidth theme="orange" onClick={handleSearch}>Search</Button>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiBookmark className="text-orange-500" /> Saved Jobs
                </h3>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {savedJobs.length}
                </span>
              </div>
              <div className="space-y-3">
                {savedJobs.slice(0, 3).map((job, idx) => (
                  <div key={idx} className="flex gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center shrink-0">
                      <FiBriefcase className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{job.title}</p>
                      <p className="text-xs text-gray-500 truncate">{job.company}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" fullWidth className="text-orange-600">View All Saved</Button>
              </div>
            </Card>

            <SkillsWidget skills={skills} editable={false} />
          </div>

          {/* Middle Column - Recommendations */}
          <div className="lg:col-span-6 space-y-6">
            <JobRecommendationsWidget jobs={recommendedJobs} title="Recommended for You" />
            
            {/* Interviews */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Upcoming Interviews</h3>
              <div className="space-y-3">
                {interviewSchedule.map((interview) => (
                  <div key={interview.id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                    <p className="font-bold text-gray-900 text-sm">{interview.company}</p>
                    <p className="text-xs text-gray-600 mb-2">{interview.role}</p>
                    <div className="flex justify-between text-xs text-orange-700 font-medium">
                      <span>{interview.date}</span>
                      <span>{interview.type}</span>
                    </div>
                  </div>
                ))}
                {interviewSchedule.length === 0 && <p className="text-sm text-gray-500">No upcoming interviews.</p>}
              </div>
            </Card>
          </div>

          {/* Right Column - Status */}
          <div className="lg:col-span-3 space-y-6">
            <ApplicationStatusWidget applications={applications} />
            <ProfileCard user={user} badges={[{ label: 'Job Seeker', className: 'bg-orange-50 text-orange-700' }]} showEdit={false} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
