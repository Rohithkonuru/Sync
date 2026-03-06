import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiMapPin, FiPhone, FiFileText, FiX, FiUpload, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { authService } from '../services/api';
import { countryCodes, getCountryObject } from '../utils/countryCodes';

const NewRegisterForm = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    user_type: 'professional',
    phone: '',
    location: '',
    headline: '',
    bio: '',
    skills: [],
    // Company fields for recruiters
    company_name: '',
    company_description: '',
    company_website: '',
    company_location: '',
    company_industry: '',
    company_size: ''
  });

  // Verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOTP, setEmailOTP] = useState('');
  const [phoneOTP, setPhoneOTP] = useState('');
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  const [phoneOTPSent, setPhoneOTPSent] = useState(false);
  const [sendingEmailOTP, setSendingEmailOTP] = useState(false);
  const [sendingPhoneOTP, setSendingPhoneOTP] = useState(false);
  const [verifyingEmailOTP, setVerifyingEmailOTP] = useState(false);
  const [verifyingPhoneOTP, setVerifyingPhoneOTP] = useState(false);

  // Phone and file states
  const [selectedCountry, setSelectedCountry] = useState(getCountryObject('+1'));
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // UI states
  const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);
  const [countryCodeSearch, setCountryCodeSearch] = useState('');
  const [filteredCountryCodes, setFilteredCountryCodes] = useState(countryCodes);

  // Refs
  const resumeInputRef = useRef(null);
  const countryCodeRef = useRef(null);

  const isRecruiter = formData.user_type === 'recruiter';
  const isJobSeeker = ['student', 'job_seeker', 'professional'].includes(formData.user_type);

  // Effects
  useEffect(() => {
    const filtered = countryCodes.filter(country =>
      country.country.toLowerCase().includes(countryCodeSearch.toLowerCase()) ||
      country.code.includes(countryCodeSearch)
    );
    setFilteredCountryCodes(filtered);
  }, [countryCodeSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryCodeRef.current && !countryCodeRef.current.contains(event.target)) {
        setShowCountryCodeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
  };

  const handleCountryCodeChange = (code) => {
    const country = getCountryObject(code);
    setSelectedCountry(country);
    setShowCountryCodeDropdown(false);
    setCountryCodeSearch('');
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setResumeFile(file);
      setResumeFileName(file.name);
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeFileName('');
    if (resumeInputRef.current) {
      resumeInputRef.current.value = '';
    }
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

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // OTP handlers
  const handleSendEmailOTP = async () => {
    if (!formData.email) {
      toast.error('Please enter your email first');
      return;
    }
    
    setSendingEmailOTP(true);
    try {
      await authService.sendOTP(formData.email, null);
      setEmailOTPSent(true);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setSendingEmailOTP(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (emailOTP.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setVerifyingEmailOTP(true);
    try {
      await authService.verifyOTP(formData.email, null, emailOTP);
      setEmailVerified(true);
      setEmailOTPSent(false);
      setEmailOTP('');
      toast.success('Email verified successfully');
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setVerifyingEmailOTP(false);
    }
  };

  const handleSendPhoneOTP = async () => {
    if (!formData.phone) {
      toast.error('Please enter your phone number first');
      return;
    }

    setSendingPhoneOTP(true);
    try {
      await authService.sendOTP(null, selectedCountry.code + formData.phone);
      setPhoneOTPSent(true);
      toast.success('OTP sent to your phone');
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setSendingPhoneOTP(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (phoneOTP.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setVerifyingPhoneOTP(true);
    try {
      await authService.verifyOTP(null, selectedCountry.code + formData.phone, phoneOTP);
      setPhoneVerified(true);
      setPhoneOTPSent(false);
      setPhoneOTP('');
      toast.success('Phone verified successfully');
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setVerifyingPhoneOTP(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      toast.error('Please fill all required fields');
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Skip verification for testing
    // if (!emailVerified || !phoneVerified) {
    //   toast.error('Please verify both email and phone number');
    //   return;
    // }

    if (isJobSeeker && !resumeFile) {
      toast.error('Please upload your resume');
      return;
    }

    if (isRecruiter && (!formData.company_name || !formData.company_description)) {
      toast.error('Please fill company details');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'skills') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add skills as comma-separated string
      submitData.append('skills', formData.skills.join(','));
      
      // Add phone with country code
      submitData.append('phone', selectedCountry.code + formData.phone);
      
      // Add resume file if exists
      if (resumeFile) {
        submitData.append('resume_file', resumeFile);
      }
      
      // Add verification flags
      submitData.append('email_verified', emailVerified);
      submitData.append('phone_verified', phoneVerified);

      await register(submitData);
      toast.success('Account created successfully!');
      navigate('/home');
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map(err => 
            typeof err === 'string' ? err : err.msg || 'Validation error'
          ).join(', ');
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
        <p className="text-gray-600">Join our network of professionals.</p>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm">Basic Info</span>
          </div>
          <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm">Details</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 ? (
          /* Step 1: Basic Information */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <div className="mt-1 relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="First name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <div className="mt-1 relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 space-y-2">
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={emailVerified}
                    className={`pl-10 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 ${
                      emailVerified ? 'bg-green-50 border-green-300' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter your email"
                  />
                  {emailVerified && <FiCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600" />}
                </div>
                
                {!emailVerified && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSendEmailOTP}
                      disabled={sendingEmailOTP || !formData.email}
                      className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                    >
                      {sendingEmailOTP ? 'Sending...' : emailOTPSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                    {emailOTPSent && (
                      <>
                        <input
                          type="text"
                          maxLength="6"
                          value={emailOTP}
                          onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter OTP"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOTP}
                          disabled={verifyingEmailOTP || emailOTP.length !== 6}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {verifyingEmailOTP ? 'Verifying...' : 'Verify'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="password"
                  type="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="mt-1 relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="confirm_password"
                  type="password"
                  required
                  minLength="6"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">I am a</label>
              <select
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="job_seeker">Job Seeker</option>
                <option value="professional">Professional</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Detailed Information */
          <div className="space-y-4">
            {/* Phone Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="mt-1 space-y-2">
                <div className="flex gap-2">
                  <div className="relative" ref={countryCodeRef}>
                    <button
                      type="button"
                      onClick={() => setShowCountryCodeDropdown(!showCountryCodeDropdown)}
                      className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <span className="mr-2">{selectedCountry.flag}</span>
                      <span className="text-sm">{selectedCountry.code}</span>
                      <FiLock className="ml-2 w-4 h-4 transform rotate-90" />
                    </button>
                    {showCountryCodeDropdown && (
                      <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b">
                          <input
                            type="text"
                            value={countryCodeSearch}
                            onChange={(e) => setCountryCodeSearch(e.target.value)}
                            placeholder="Search country..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCountryCodes.map((country, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleCountryCodeChange(country.code)}
                              className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <span className="mr-2">{country.flag}</span>
                              <span className="flex-1">{country.country}</span>
                              <span className="text-gray-600">{country.code}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      disabled={phoneVerified}
                      className={`pl-10 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 ${
                        phoneVerified ? 'bg-green-50 border-green-300' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="1234567890"
                    />
                    {phoneVerified && <FiCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600" />}
                  </div>
                </div>
                
                {!phoneVerified && formData.phone && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSendPhoneOTP}
                      disabled={sendingPhoneOTP}
                      className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                    >
                      {sendingPhoneOTP ? 'Sending...' : phoneOTPSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                    {phoneOTPSent && (
                      <>
                        <input
                          type="text"
                          maxLength="6"
                          value={phoneOTP}
                          onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter OTP"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOTP}
                          disabled={verifyingPhoneOTP || phoneOTP.length !== 6}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {verifyingPhoneOTP ? 'Verifying...' : 'Verify'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <div className="mt-1 relative">
                <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* Job Seeker Specific Fields */}
            {isJobSeeker && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Headline</label>
                  <input
                    name="headline"
                    type="text"
                    value={formData.headline}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    name="bio"
                    rows="3"
                    value={formData.bio}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Skills</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                      placeholder="Add a skill and press Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Resume *</label>
                  <p className="text-xs text-gray-500 mb-2">Upload your resume (PDF, DOC, DOCX - Max 10MB)</p>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                  <div className="mt-1">
                    {resumeFile ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FiFileText className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-gray-700">{resumeFileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveResume}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                      >
                        <FiUpload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload resume</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Recruiter Specific Fields */}
            {isRecruiter && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                  <input
                    name="company_name"
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Description *</label>
                  <textarea
                    name="company_description"
                    rows="3"
                    required
                    value={formData.company_description}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                    placeholder="Describe your company..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Website</label>
                  <input
                    name="company_website"
                    type="url"
                    value={formData.company_website}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Location</label>
                  <div className="mt-1 relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      name="company_location"
                      type="text"
                      value={formData.company_location}
                      onChange={handleChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <select
                    name="company_industry"
                    value={formData.company_industry}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                  >
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="consulting">Consulting</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Size</label>
                  <select
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default NewRegisterForm;
