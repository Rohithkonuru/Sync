import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentDashboardEnhanced from '../components/dashboards/StudentDashboardEnhanced';
import JobSeekerDashboardEnhanced from '../components/dashboards/JobSeekerDashboardEnhanced';
import ProfessionalDashboardEnhanced from '../components/dashboards/ProfessionalDashboardEnhanced';
import RecruiterDashboardEnhanced from '../components/dashboards/RecruiterDashboardEnhanced';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import MobileOptimizedDashboard from '../components/dashboards/MobileOptimizedDashboard';

const ResponsiveDashboard = ({ desktop }) => (
  <>
    <div className="hidden md:block">{desktop}</div>
    <div className="block md:hidden">
      <MobileOptimizedDashboard />
    </div>
  </>
);

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is not authenticated, redirect to Sync landing page
  // This handles cases where someone directly accesses /home without being logged in
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // If user is authenticated, show appropriate dashboard
  if (user) {
    if (user.user_type === 'admin') {
      return <ResponsiveDashboard desktop={<AdminDashboard />} />;
    } else if (user.user_type === 'recruiter') {
      return <ResponsiveDashboard desktop={<RecruiterDashboardEnhanced />} />;
    } else if (user.user_type === 'professional') {
      return <ResponsiveDashboard desktop={<ProfessionalDashboardEnhanced />} />;
    } else if (user.user_type === 'student' || user.user_type === 'job_seeker') {
      return <ResponsiveDashboard desktop={<StudentDashboardEnhanced />} />;
    } else {
      // Default to student dashboard for any other role
      return <ResponsiveDashboard desktop={<StudentDashboardEnhanced />} />;
    }
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default Home;
