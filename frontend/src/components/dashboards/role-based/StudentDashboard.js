import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { jobService, postService } from '../../../services/api';
import { Button, Card, ProgressBar } from '../../ui';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Shared Components
import ProfileCard from '../shared/ProfileCard';
import SkillsWidget from '../shared/SkillsWidget';
import EducationCard from '../shared/EducationCard';
import CertificationsCard from '../shared/CertificationsCard';
import ApplicationStatusWidget from '../shared/ApplicationStatusWidget';
import JobRecommendationsWidget from '../shared/JobRecommendationsWidget';

// Dashboard Specific Components (could be moved to shared if reused)
const LearningResourcesCard = ({ resources = [] }) => (
  <Card>
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-gray-900">Learning Progress</h3>
      <button className="text-sm text-blue-600 hover:underline">View Library</button>
    </div>
    <div className="space-y-4">
      {resources.map((res) => (
        <div key={res.id} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{res.title}</span>
            <span className="text-gray-500">{res.progress}%</span>
          </div>
          <ProgressBar value={res.progress} color="blue" showLabel={false} className="h-2" />
          <p className="text-xs text-gray-400">{res.provider}</p>
        </div>
      ))}
    </div>
  </Card>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  // const [feedPosts, setFeedPosts] = useState([]); // Removed for now to focus on student specific features first

  // Mock Data (matches original Enhanced dashboard)
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
  const [certifications, setCertifications] = useState([
    { id: 1, name: 'AWS Cloud Practitioner', date: '2023', issuer: 'Amazon' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [internshipData, applicationData] = await Promise.all([
        jobService.getJobs({ job_type: 'internship', limit: 5 }).catch(() => []),
        jobService.getApplications({ limit: 5 }).catch(() => []),
      ]);

      setInternships(internshipData);
      setApplications(applicationData);
    } catch (error) {
      console.error('Error loading student dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (skill) => {
    setSkills([...skills, skill]);
    toast.success('Skill added');
  };

  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
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
        
        {/* Student Completion Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Student Career Launchpad</h2>
              <p className="text-blue-100 mb-4">Complete your profile to unlock exclusive internship opportunities.</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <div className="h-2 bg-blue-400/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[70%] rounded-full"></div>
                  </div>
                </div>
                <span className="font-semibold">70% Complete</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="white" onClick={() => navigate('/profile')}>
                Complete Profile
              </Button>
              <Button 
                variant="outline" 
                className="text-white border-white hover:bg-white/10"
                onClick={() => navigate('/profile')}
              >
                Build Resume
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Profile & Info */}
          <div className="lg:col-span-3 space-y-6">
            <ProfileCard 
              user={user} 
              badges={[
                { label: 'Student', className: 'bg-blue-50 text-blue-700' },
                { label: 'Open to Internships', className: 'bg-purple-50 text-purple-700' }
              ]}
              completionPercentage={70}
            />
            <EducationCard education={education} />
            <SkillsWidget skills={skills} onAddSkill={handleAddSkill} onRemoveSkill={handleRemoveSkill} />
            <CertificationsCard certifications={certifications} />
          </div>

          {/* Middle Column - Learning & Opportunities */}
          <div className="lg:col-span-6 space-y-6">
            <LearningResourcesCard resources={learningResources} />
            <JobRecommendationsWidget jobs={internships} title="Recommended Internships" />
          </div>

          {/* Right Column - Status & Notifications */}
          <div className="lg:col-span-3 space-y-6">
            <ApplicationStatusWidget applications={applications} />
            {/* Could add NotificationWidget here later */}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
