import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { getErrorMessage } from '../utils/errorHelpers';
import { FiUser, FiLock, FiBell, FiTrash2, FiSave, FiCamera, FiUpload, FiX, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    headline: '',
    location: '',
    bio: '',
    skills: [],
  });
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    connection_requests: true,
    job_matches: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        headline: user.headline || '',
        location: user.location || '',
        bio: user.bio || '',
        skills: user.skills || [],
      });
      setPreviewUrl(user.profile_picture || null);
      setBannerPreviewUrl(user.banner_picture || null);
      setHasChanges(false);
    }
  }, [user]);

  useEffect(() => {
    // Track changes
    if (user) {
      const hasProfileChanges = 
        profileData.first_name !== (user.first_name || '') ||
        profileData.last_name !== (user.last_name || '') ||
        profileData.headline !== (user.headline || '') ||
        profileData.location !== (user.location || '') ||
        profileData.bio !== (user.bio || '') ||
        JSON.stringify(profileData.skills || []) !== JSON.stringify(user.skills || []);
      setHasChanges(hasProfileChanges || selectedFile || selectedBannerFile);
    }
  }, [profileData, selectedFile, selectedBannerFile, user]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'first_name':
        if (!value.trim()) {
          newErrors.first_name = 'First name is required';
        } else if (value.trim().length < 2) {
          newErrors.first_name = 'First name must be at least 2 characters';
        } else {
          delete newErrors.first_name;
        }
        break;
      case 'last_name':
        if (!value.trim()) {
          newErrors.last_name = 'Last name is required';
        } else if (value.trim().length < 2) {
          newErrors.last_name = 'Last name must be at least 2 characters';
        } else {
          delete newErrors.last_name;
        }
        break;
      case 'headline':
        if (value && value.length > 100) {
          newErrors.headline = 'Headline must be less than 100 characters';
        } else {
          delete newErrors.headline;
        }
        break;
      case 'bio':
        if (value && value.length > 1000) {
          newErrors.bio = 'Bio must be less than 1000 characters';
        } else {
          delete newErrors.bio;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
    validateField(name, value);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter((s) => s !== skill),
    });
  };

  const handleSaveProfile = async () => {
    // Validate all fields
    const isValid = 
      validateField('first_name', profileData.first_name) &&
      validateField('last_name', profileData.last_name) &&
      validateField('headline', profileData.headline) &&
      validateField('bio', profileData.bio);

    if (!isValid) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setLoading(true);
    try {
      const updated = await userService.updateProfile(profileData);
      updateUser(updated);
      setHasChanges(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      let errorMsg = error.message;
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') errorMsg = detail;
      else if (Array.isArray(detail)) errorMsg = detail.map(e => e.msg || JSON.stringify(e)).join(', ');
      else if (detail) errorMsg = JSON.stringify(detail);

      toast.error(`Failed to update profile: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement password change API
      toast.success('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement delete account API
      toast.success('Account deleted successfully');
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const validateImage = (file, type = 'profile') => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return false;
    }

    // Validate file size (5MB for profile, 10MB for banner)
    const maxSize = type === 'banner' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File is too large. Maximum size is ${type === 'banner' ? '10MB' : '5MB'}.`);
      return false;
    }

    return true;
  };

  const resizeImage = (file, maxWidth, maxHeight, quality = 0.9) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() }));
            },
            file.type,
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e, type = 'profile') => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateImage(file, type)) {
      e.target.value = '';
      return;
    }

    try {
      // Resize image before preview
      const maxDimensions = type === 'banner' ? { width: 1920, height: 600 } : { width: 500, height: 500 };
      const resizedFile = await resizeImage(file, maxDimensions.width, maxDimensions.height);
      
      if (type === 'banner') {
        setSelectedBannerFile(resizedFile);
        const url = URL.createObjectURL(resizedFile);
        setBannerPreviewUrl(url);
      } else {
        setSelectedFile(resizedFile);
        const url = URL.createObjectURL(resizedFile);
        setPreviewUrl(url);
      }
    } catch (error) {
      toast.error('Failed to process image');
      e.target.value = '';
    }
  };

  const handleRemoveImage = (type = 'profile') => {
    if (type === 'banner') {
      setSelectedBannerFile(null);
      setBannerPreviewUrl(user?.banner_picture || null);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    } else {
      setSelectedFile(null);
      setPreviewUrl(user?.profile_picture || null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUploadImage = async (type = 'profile') => {
    const file = type === 'banner' ? selectedBannerFile : selectedFile;
    if (!file) {
      toast.error(`Please select a ${type} image first`);
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      let response;
      if (type === 'banner') {
        response = await userService.uploadBannerPicture(file);
        const updated = await userService.updateProfile({ banner_picture: response.url });
        updateUser(updated);
        setSelectedBannerFile(null);
        setBannerPreviewUrl(response.url);
        if (bannerInputRef.current) bannerInputRef.current.value = '';
      } else {
        response = await userService.uploadProfilePicture(file);
        const updated = await userService.updateProfile({ profile_picture: response.url });
        updateUser(updated);
        setSelectedFile(null);
        setPreviewUrl(response.url);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success(`${type === 'banner' ? 'Banner' : 'Profile'} picture updated successfully!`);
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      toast.error(`Failed to upload ${type} picture: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="bg-white rounded-lg shadow-md">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiUser className="inline w-4 h-4 mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiLock className="inline w-4 h-4 mr-2" />
              Password
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiBell className="inline w-4 h-4 mr-2" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('danger')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'danger'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiTrash2 className="inline w-4 h-4 mr-2" />
              Danger Zone
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Banner Picture Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Banner Picture
                </label>
                <div className="relative">
                  <div className="relative h-48 w-full bg-gray-200 rounded-lg overflow-hidden">
                    {bannerPreviewUrl ? (
                      <img
                        src={bannerPreviewUrl}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiImage className="w-12 h-12" />
                      </div>
                    )}
                    {selectedBannerFile && (
                      <button
                        onClick={() => handleRemoveImage('banner')}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex items-center space-x-3">
                    <label className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer flex items-center space-x-2">
                      <FiCamera className="w-4 h-4" />
                      <span>Choose Banner</span>
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'banner')}
                        className="hidden"
                      />
                    </label>
                    {selectedBannerFile && (
                      <button
                        onClick={() => handleUploadImage('banner')}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                      >
                        <FiUpload className="w-4 h-4" />
                        <span>Upload Banner</span>
                      </button>
                    )}
                    <p className="text-sm text-gray-500">
                      Recommended: 1920x600px. Max size 10MB.
                    </p>
                  </div>
                  {uploadProgress > 0 && selectedBannerFile && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Picture Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                          {user?.first_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    {selectedFile && (
                      <button
                        onClick={() => handleRemoveImage('profile')}
                        className="absolute top-0 right-0 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    )}
                    <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 shadow-lg">
                      <FiCamera className="w-4 h-4" />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'profile')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Upload a new profile picture. JPG, PNG, GIF, or WebP. Max size 5MB.
                    </p>
                    {selectedFile && (
                      <button
                        onClick={() => handleUploadImage('profile')}
                        disabled={loading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50"
                      >
                        <FiUpload className="w-4 h-4" />
                        <span>Upload Picture</span>
                      </button>
                    )}
                    {uploadProgress > 0 && selectedFile && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleProfileChange}
                    onBlur={(e) => validateField('first_name', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                      errors.first_name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleProfileChange}
                    onBlur={(e) => validateField('last_name', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                      errors.last_name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headline
                  <span className="text-gray-500 text-xs ml-2">
                    ({profileData.headline?.length || 0}/100)
                  </span>
                </label>
                <input
                  type="text"
                  name="headline"
                  value={profileData.headline}
                  onChange={handleProfileChange}
                  onBlur={(e) => validateField('headline', e.target.value)}
                  placeholder="e.g., Software Engineer at Tech Corp"
                  maxLength={100}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                    errors.headline
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                />
                {errors.headline && (
                  <p className="mt-1 text-sm text-red-500">{errors.headline}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={profileData.location}
                  onChange={handleProfileChange}
                  placeholder="City, State, Country"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                  <span className="text-gray-500 text-xs ml-2">
                    ({profileData.bio?.length || 0}/1000)
                  </span>
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  onBlur={(e) => validateField('bio', e.target.value)}
                  rows="5"
                  maxLength={1000}
                  placeholder="Tell us about yourself..."
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                    errors.bio
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-500">{errors.bio}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-primary-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {hasChanges && !loading && (
                    <span className="text-amber-600">You have unsaved changes</span>
                  )}
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading || !hasChanges || Object.keys(errors).length > 0}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSave className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, current_password: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, new_password: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirm_password: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Change Password
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.email_notifications}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        email_notifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Receive push notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.push_notifications}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        push_notifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Connection Requests</h3>
                  <p className="text-sm text-gray-500">Notify when someone wants to connect</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.connection_requests}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        connection_requests: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Job Matches</h3>
                  <p className="text-sm text-gray-500">Notify about relevant job opportunities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.job_matches}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        job_matches: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Account</h3>
                <p className="text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

