import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService, userService } from '../services/api';
import { FiX, FiUpload, FiFile, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const EnhancedApplicationForm = ({ jobId, jobTitle, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    contact_number: '',
    address: '',
    cover_letter: '',
    contact_email: '',
    contact_phone: '',
    portfolio_url: '',
    skills: [],
    experience_years: '',
    custom_fields: {}
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newSkill, setNewSkill] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [profileResumeUrl, setProfileResumeUrl] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const getExperienceYearsFromProfile = (experience = []) => {
    if (!Array.isArray(experience) || experience.length === 0) return '';
    return experience.length * 2;
  };

  useEffect(() => {
    const loadProfileDefaults = async () => {
      if (!currentUser) {
        setLoadingProfile(false);
        return;
      }

      try {
        const profileId = currentUser.id || currentUser._id;
        const profile = profileId ? await userService.getProfile(profileId) : currentUser;
        const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
        const normalizedSkills = Array.isArray(profile?.skills)
          ? profile.skills.map((skill) => (typeof skill === 'string' ? skill : skill?.name)).filter(Boolean)
          : [];

        setFormData((prev) => ({
          ...prev,
          full_name: prev.full_name || fullName,
          email: prev.email || profile?.email || '',
          contact_number: prev.contact_number || profile?.phone || '',
          address: prev.address || profile?.location || '',
          contact_email: prev.contact_email || profile?.email || '',
          contact_phone: prev.contact_phone || profile?.phone || '',
          portfolio_url: prev.portfolio_url || profile?.portfolio_url || profile?.projects?.[0]?.url || '',
          skills: prev.skills.length > 0 ? prev.skills : normalizedSkills,
          experience_years: prev.experience_years || getExperienceYearsFromProfile(profile?.experience),
        }));

        if (profile?.resume_url) {
          setProfileResumeUrl(profile.resume_url);
          const resumeName = profile.resume_url.split('/').pop();
          setResumeFileName(resumeName || 'Profile resume');
        }
      } catch (error) {
        console.error('Failed to load profile defaults:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfileDefaults();
  }, [currentUser]);

  const validateForm = () => {
    const newErrors = {};
    
    // Mandatory fields
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.contact_number)) {
      newErrors.contact_number = 'Invalid phone number format';
    }
    
    if (!resumeFile && !profileResumeUrl) {
      newErrors.resume = 'Resume upload is required';
    }
    
    // Optional fields validation (only if provided)
    
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }
    
    if (formData.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(formData.contact_phone)) {
      newErrors.contact_phone = 'Invalid phone number format';
    }
    
    if (formData.portfolio_url && !/^https?:\/\/.+/.test(formData.portfolio_url)) {
      newErrors.portfolio_url = 'Invalid URL format';
    }
    
    if (formData.experience_years && (formData.experience_years < 0 || formData.experience_years > 50)) {
      newErrors.experience_years = 'Experience years must be between 0 and 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        toast.error('Invalid file type. Only PDF and DOC files are allowed.');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setResumeFile(file);
      setResumeFileName(file.name);
      setProfileResumeUrl('');
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setResumeFileName('');
    setProfileResumeUrl('');
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    try {
      const applicationData = {
        full_name: formData.full_name,
        email: formData.email,
        contact_number: formData.contact_number,
        address: formData.address,
        cover_letter: formData.cover_letter,
        contact_email: formData.contact_email || formData.email,
        contact_phone: formData.contact_phone || formData.contact_number,
        portfolio_url: formData.portfolio_url,
        skills: JSON.stringify(formData.skills),
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        custom_fields: JSON.stringify(formData.custom_fields)
      };

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await jobService.applyJob(jobId, applicationData, resumeFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('Application submitted successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } catch (error) {
      setUploadProgress(0);
      
      // Handle validation errors from backend
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'object' && detail.errors) {
          // Backend returned structured errors
          setErrors(detail.errors);
          toast.error(detail.message || 'Please fix the errors in the form');
        } else if (typeof detail === 'string') {
          // Backend returned a string error
          toast.error(detail);
        } else {
          toast.error('Validation failed. Please check all required fields.');
        }
      } else {
        toast.error(error.message || 'Failed to submit application');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Apply for {jobTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.full_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
              }`}
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
              }`}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number *
            </label>
            <input
              type="tel"
              name="contact_number"
              required
              value={formData.contact_number}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.contact_number ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
              }`}
              placeholder="+1 (555) 123-4567"
            />
            {errors.contact_number && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_number}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Street address, City, State, ZIP"
            />
          </div>

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Letter
            </label>
            <textarea
              name="cover_letter"
              value={formData.cover_letter}
              onChange={handleChange}
              rows="6"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.cover_letter ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
              }`}
              placeholder="Tell the employer why you're a great fit for this position... (Optional)"
            />
            {errors.cover_letter && (
              <p className="text-red-500 text-sm mt-1">{errors.cover_letter}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  errors.contact_email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                }`}
                placeholder="your.email@example.com"
              />
              {errors.contact_email && (
                <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  errors.contact_phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.contact_phone && (
                <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
              )}
            </div>
          </div>

          {/* Portfolio URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portfolio URL
            </label>
            <input
              type="url"
              name="portfolio_url"
              value={formData.portfolio_url}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.portfolio_url ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
              }`}
              placeholder="https://yourportfolio.com"
            />
            {errors.portfolio_url && (
              <p className="text-red-500 text-sm mt-1">{errors.portfolio_url}</p>
            )}
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resume (PDF or DOC) *
            </label>
            {errors.resume && (
              <p className="text-red-500 text-sm mb-2">{errors.resume}</p>
            )}
            {!resumeFile && !profileResumeUrl ? (
              <label className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary-500 transition">
                <div className="text-center">
                  <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">{loadingProfile ? 'Loading profile...' : 'Click to upload or drag and drop'}</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FiFile className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{resumeFileName || 'Profile resume'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {profileResumeUrl && !resumeFile && (
                      <span className="text-xs text-green-600">Using profile resume</span>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="Add a skill"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-primary-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Experience Years */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              name="experience_years"
              min="0"
              max="50"
              value={formData.experience_years}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.experience_years ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
              }`}
              placeholder="0"
            />
            {errors.experience_years && (
              <p className="text-red-500 text-sm mt-1">{errors.experience_years}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.full_name || !formData.email || !formData.contact_number || !resumeFile}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedApplicationForm;

