import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser, FiPhone, FiMapPin, FiChevronDown, FiFileText, FiX } from 'react-icons/fi';
import { authService } from '../services/api';
import { countryCodes, getCountryObject, getCountryByCode } from '../utils/countryCodes';
import { filterLocations } from '../utils/locations';
import { getErrorMessage } from '../utils/errorHelpers';
import toast from 'react-hot-toast';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'professional',
    // Personal details (for job seekers)
    location: '',
    headline: '',
    bio: '',
    phone: '',
    phoneCountryCode: '+1',
    skills: [],
    // Company details (for recruiters)
    company_name: '',
    company_description: '',
    company_website: '',
    company_location: '',
    company_industry: '',
    company_size: '',
  });
  
  // OTP states
  const [emailOTP, setEmailOTP] = useState('');
  const [phoneOTP, setPhoneOTP] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  const [phoneOTPSent, setPhoneOTPSent] = useState(false);
  const [sendingEmailOTP, setSendingEmailOTP] = useState(false);
  const [sendingPhoneOTP, setSendingPhoneOTP] = useState(false);
  const [verifyingEmailOTP, setVerifyingEmailOTP] = useState(false);
  const [verifyingPhoneOTP, setVerifyingPhoneOTP] = useState(false);
  
  // Location autocomplete states
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationInputFocused, setLocationInputFocused] = useState(false);
  const locationRef = useRef(null);
  const companyLocationRef = useRef(null);
  
  // Country code selector states
  const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);
  const [countryCodeSearch, setCountryCodeSearch] = useState('');
  const countryCodeRef = useRef(null);
  
  const [newSkill, setNewSkill] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const resumeInputRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryCodeRef.current && !countryCodeRef.current.contains(event.target)) {
        setShowCountryCodeDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationSuggestions(false);
      }
      if (companyLocationRef.current && !companyLocationRef.current.contains(event.target)) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Handle location autocomplete
    if (name === 'location' || name === 'company_location') {
      if (value.length > 0) {
        const suggestions = filterLocations(value);
        setLocationSuggestions(suggestions);
        setShowLocationSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    }
  };

  // Handle country code change
  const handleCountryCodeChange = (code) => {
    setFormData({
      ...formData,
      phoneCountryCode: code,
    });
    setShowCountryCodeDropdown(false);
    setCountryCodeSearch('');
  };

  // Handle phone input - detect country code
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Check if user typed a country code (e.g., +91)
    const matchedCountry = countryCodes.find(country => 
      value.startsWith(country.code) && value.length >= country.code.length
    );
    
    if (matchedCountry && value === matchedCountry.code) {
      setFormData({
        ...formData,
        phoneCountryCode: matchedCountry.code,
        phone: '',
      });
      return;
    }
    
    // Remove country code from phone number if it starts with one
    countryCodes.forEach(country => {
      if (value.startsWith(country.code) && value.length > country.code.length) {
        value = value.substring(country.code.length).trim();
        setFormData({
          ...formData,
          phoneCountryCode: country.code,
          phone: value,
        });
        return;
      }
    });
    
    // Regular phone number input
    setFormData({
      ...formData,
      phone: value,
    });
  };

  // Handle location selection
  const handleLocationSelect = (location, fieldName) => {
    setFormData({
      ...formData,
      [fieldName]: location,
    });
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  // Send Email OTP
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
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setSendingEmailOTP(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOTP = async () => {
    if (!emailOTP || emailOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    setVerifyingEmailOTP(true);
    try {
      await authService.verifyOTP(formData.email, null, emailOTP);
      setEmailVerified(true);
      toast.success('Email verified successfully');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Invalid OTP');
    } finally {
      setVerifyingEmailOTP(false);
    }
  };

  // Send Phone OTP
  const handleSendPhoneOTP = async () => {
    const fullPhone = `${formData.phoneCountryCode}${formData.phone}`;
    if (!formData.phone) {
      toast.error('Please enter your phone number first');
      return;
    }
    
    setSendingPhoneOTP(true);
    try {
      await authService.sendOTP(null, fullPhone);
      setPhoneOTPSent(true);
      toast.success('OTP sent to your phone');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setSendingPhoneOTP(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyPhoneOTP = async () => {
    if (!phoneOTP || phoneOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    const fullPhone = `${formData.phoneCountryCode}${formData.phone}`;
    setVerifyingPhoneOTP(true);
    try {
      await authService.verifyOTP(null, fullPhone, phoneOTP);
      setPhoneVerified(true);
      toast.success('Phone verified successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setVerifyingPhoneOTP(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const isJobSeeker = ['job_seeker', 'student', 'professional'].includes(formData.user_type);
  const isRecruiter = formData.user_type === 'recruiter';

  // Filter country codes based on search
  const filteredCountryCodes = countryCodes.filter(country =>
    country.country.toLowerCase().includes(countryCodeSearch.toLowerCase()) ||
    country.code.includes(countryCodeSearch)
  );

  const handleNext = (e) => {
    e.preventDefault();
    // Validate step 1 fields
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Check email verification
    if (!emailVerified) {
      toast.error('Please verify your email before proceeding');
      return;
    }
    
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields based on user type
      if (isRecruiter) {
        if (!formData.company_name || !formData.company_description) {
          toast.error('Company name and description are required for recruiters');
          setLoading(false);
          return;
        }
      }
      
      // Check resume upload for students, professionals, and job seekers
      if (isJobSeeker && !resumeFile) {
        toast.error('Resume upload is required for students, professionals, and job seekers');
        setLoading(false);
        return;
      }
      
      // Check phone verification for job seekers
      if (isJobSeeker && formData.phone && !phoneVerified) {
        toast.error('Please verify your phone number');
        setLoading(false);
        return;
      }

      // Prepare data to send
      const dataToSend = { ...formData };
      
      // Combine country code with phone number
      if (dataToSend.phone) {
        dataToSend.phone = `${dataToSend.phoneCountryCode}${dataToSend.phone}`;
      }
      delete dataToSend.phoneCountryCode;
      
      // Remove empty strings and convert to null for optional fields
      if (isJobSeeker) {
        // For job seekers, keep personal details
        if (!dataToSend.location) delete dataToSend.location;
        if (!dataToSend.headline) delete dataToSend.headline;
        if (!dataToSend.bio) delete dataToSend.bio;
        if (!dataToSend.phone) delete dataToSend.phone;
        if (dataToSend.skills.length === 0) delete dataToSend.skills;
      } else {
        // Remove personal details for recruiters
        delete dataToSend.location;
        delete dataToSend.headline;
        delete dataToSend.bio;
        delete dataToSend.phone;
        delete dataToSend.skills;
      }

      if (isRecruiter) {
        // For recruiters, keep company details
        if (!dataToSend.company_website) delete dataToSend.company_website;
        if (!dataToSend.company_location) delete dataToSend.company_location;
        if (!dataToSend.company_industry) delete dataToSend.company_industry;
        if (!dataToSend.company_size) delete dataToSend.company_size;
      } else {
        // Remove company details for job seekers
        delete dataToSend.company_name;
        delete dataToSend.company_description;
        delete dataToSend.company_website;
        delete dataToSend.company_location;
        delete dataToSend.company_industry;
        delete dataToSend.company_size;
      }

      // If resume file exists, send as FormData
      if (resumeFile && isJobSeeker) {
        const formDataToSend = new FormData();
        Object.keys(dataToSend).forEach(key => {
          if (dataToSend[key] !== null && dataToSend[key] !== undefined) {
            if (Array.isArray(dataToSend[key])) {
              formDataToSend.append(key, JSON.stringify(dataToSend[key]));
            } else {
              formDataToSend.append(key, dataToSend[key]);
            }
          }
        });
        formDataToSend.append('resume_file', resumeFile);
        
        // Call register with FormData
        await register(formDataToSend);
      } else {
        await register(dataToSend);
      }
      
      navigate('/');
    } catch (error) {
      // Error handled in auth context
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = getCountryObject(formData.phoneCountryCode);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-md w-full space-y-8 py-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Join Sync</h2>
            <p className="mt-2 text-gray-600">
              {step === 1 ? 'Create your account' : `Complete your ${isRecruiter ? 'company' : 'personal'} details`}
            </p>
            {step === 2 && (
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <span className="ml-2 text-sm text-gray-600">Basic Info</span>
                </div>
                <div className="w-8 h-0.5 bg-primary-600"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{isRecruiter ? 'Company' : 'Personal'} Details</span>
                </div>
              </div>
            )}
          </div>
          <form className="mt-8 space-y-6" onSubmit={step === 1 ? handleNext : handleSubmit}>
            {step === 1 ? (
              /* Step 1: Basic Information */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <div className="mt-1 relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        inputMode="text"
                        required
                        value={formData.first_name}
                        onChange={handleChange}
                        className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="First name"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <div className="mt-1 relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        inputMode="text"
                        required
                        value={formData.last_name}
                        onChange={handleChange}
                        className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 space-y-2">
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        disabled={emailVerified}
                        className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                        placeholder="Enter your email"
                      />
                    </div>
                    {!emailVerified && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSendEmailOTP}
                          disabled={sendingEmailOTP || !formData.email}
                          className="flex-1 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingEmailOTP ? 'Sending...' : emailOTPSent ? 'Resend OTP' : 'Send OTP'}
                        </button>
                        {emailOTPSent && (
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength="6"
                            value={emailOTP}
                            onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter OTP"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        )}
                        {emailOTPSent && (
                          <button
                            type="button"
                            onClick={handleVerifyEmailOTP}
                            disabled={verifyingEmailOTP || emailOTP.length !== 6}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifyingEmailOTP ? 'Verifying...' : 'Verify'}
                          </button>
                        )}
                      </div>
                    )}
                    {emailVerified && (
                      <div className="text-sm text-green-600 flex items-center">
                        <span className="mr-2">✓</span> Email verified
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Create a password"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="user_type" className="block text-sm font-medium text-gray-700">
                    I am a
                  </label>
                  <select
                    id="user_type"
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="student">Student</option>
                    <option value="job_seeker">Job Seeker</option>
                    <option value="professional">Professional</option>
                    <option value="recruiter">Recruiter</option>
                  </select>
                </div>
              </div>
            ) : (
              /* Step 2: Conditional Details Based on User Type */
              <div className="space-y-4">
                {/* Personal Details - For Job Seekers, Students, Professionals */}
                {isJobSeeker && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
                  </div>
                  <div>
                    <label htmlFor="headline" className="block text-sm font-medium text-gray-700">
                      Headline
                    </label>
                    <input
                      id="headline"
                      name="headline"
                      type="text"
                      inputMode="text"
                      value={formData.headline}
                      onChange={handleChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div className="relative" ref={locationRef}>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <div className="mt-1 relative">
                      <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        id="location"
                        name="location"
                        type="text"
                        inputMode="text"
                        value={formData.location}
                        onChange={handleChange}
                        onFocus={() => {
                          setLocationInputFocused(true);
                          if (formData.location.length > 0) {
                            const suggestions = filterLocations(formData.location);
                            setLocationSuggestions(suggestions);
                            setShowLocationSuggestions(true);
                          }
                        }}
                        className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="City, State, Country"
                        autoComplete="off"
                      />
                    </div>
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {locationSuggestions.map((location, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleLocationSelect(location, 'location')}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {location}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1 space-y-2">
                      <div className="flex gap-2">
                        <div className="relative" ref={countryCodeRef}>
                          <button
                            type="button"
                            onClick={() => setShowCountryCodeDropdown(!showCountryCodeDropdown)}
                            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          >
                            <span className="mr-2">{selectedCountry.flag}</span>
                            <span className="text-sm">{selectedCountry.code}</span>
                            <FiChevronDown className="ml-2 w-4 h-4" />
                          </button>
                          {showCountryCodeDropdown && (
                            <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2 border-b">
                                <input
                                  type="text"
                                  value={countryCodeSearch}
                                  onChange={(e) => setCountryCodeSearch(e.target.value)}
                                  placeholder="Search country..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500"
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
                            id="phone"
                            name="phone"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            disabled={phoneVerified}
                            className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                            placeholder="1234567890"
                          />
                        </div>
                      </div>
                      {formData.phone && !phoneVerified && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSendPhoneOTP}
                            disabled={sendingPhoneOTP || !formData.phone}
                            className="flex-1 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingPhoneOTP ? 'Sending...' : phoneOTPSent ? 'Resend OTP' : 'Send OTP'}
                          </button>
                          {phoneOTPSent && (
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength="6"
                              value={phoneOTP}
                              onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, ''))}
                              placeholder="Enter OTP"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            />
                          )}
                          {phoneOTPSent && (
                            <button
                              type="button"
                              onClick={handleVerifyPhoneOTP}
                              disabled={verifyingPhoneOTP || phoneOTP.length !== 6}
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {verifyingPhoneOTP ? 'Verifying...' : 'Verify'}
                            </button>
                          )}
                        </div>
                      )}
                      {phoneVerified && (
                        <div className="text-sm text-green-600 flex items-center">
                          <span className="mr-2">✓</span> Phone verified
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows="3"
                      value={formData.bio}
                      onChange={handleChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                      Skills
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        id="skills"
                        type="text"
                        inputMode="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        className="flex-1 appearance-none relative block px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add a skill and press Enter"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        Add
                      </button>
                    </div>
                    {formData.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-2 text-primary-600 hover:text-primary-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
                      Resume <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Upload your resume (PDF, DOC, DOCX - Max 10MB)</p>
                    <input
                      ref={resumeInputRef}
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('File size must be less than 10MB');
                            return;
                          }
                          setResumeFile(file);
                          setResumeFileName(file.name);
                        }
                      }}
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
                            onClick={() => {
                              setResumeFile(null);
                              setResumeFileName('');
                              if (resumeInputRef.current) {
                                resumeInputRef.current.value = '';
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => resumeInputRef.current?.click()}
                          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2"
                        >
                          <FiFileText className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">Click to upload resume</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Company Details - For Recruiters */}
              {isRecruiter && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>
                  </div>
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="company_name"
                      name="company_name"
                      type="text"
                      inputMode="text"
                      required
                      value={formData.company_name}
                      onChange={handleChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label htmlFor="company_description" className="block text-sm font-medium text-gray-700">
                      Company Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="company_description"
                      name="company_description"
                      rows="3"
                      required
                      value={formData.company_description}
                      onChange={handleChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Describe your company..."
                    />
                  </div>
                  <div>
                    <label htmlFor="company_website" className="block text-sm font-medium text-gray-700">
                      Company Website
                    </label>
                    <input
                      id="company_website"
                      name="company_website"
                      type="url"
                      inputMode="url"
                      value={formData.company_website}
                      onChange={handleChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div className="relative" ref={companyLocationRef}>
                    <label htmlFor="company_location" className="block text-sm font-medium text-gray-700">
                      Company Location
                    </label>
                    <div className="mt-1 relative">
                      <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        id="company_location"
                        name="company_location"
                        type="text"
                        inputMode="text"
                        value={formData.company_location}
                        onChange={handleChange}
                        onFocus={() => {
                          if (formData.company_location.length > 0) {
                            const suggestions = filterLocations(formData.company_location);
                            setLocationSuggestions(suggestions);
                            setShowLocationSuggestions(true);
                          }
                        }}
                        className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="City, State, Country"
                        autoComplete="off"
                      />
                    </div>
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {locationSuggestions.map((location, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleLocationSelect(location, 'company_location')}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {location}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="company_industry" className="block text-sm font-medium text-gray-700">
                      Industry
                    </label>
                    <input
                      id="company_industry"
                      name="company_industry"
                      type="text"
                      inputMode="text"
                      value={formData.company_industry}
                      onChange={handleChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Technology, Healthcare, Finance"
                    />
                  </div>
                  <div>
                    <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
                      Company Size
                    </label>
                    <select
                      id="company_size"
                      name="company_size"
                      value={formData.company_size}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select company size</option>
                      <option value="startup">Startup (1-10)</option>
                      <option value="small">Small (11-50)</option>
                      <option value="medium">Medium (51-200)</option>
                      <option value="large">Large (201-1000)</option>
                      <option value="enterprise">Enterprise (1000+)</option>
                    </select>
                  </div>
                </>
              )}
              </div>
            )}

            <div className="flex gap-4">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`${step === 2 ? 'flex-1' : 'w-full'} py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50`}
              >
                {loading
                  ? 'Creating account...'
                  : step === 1
                  ? 'Next'
                  : 'Sign up'}
              </button>
            </div>

            <div className="text-center">
              <span className="text-gray-600">Already have an account? </span>
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:block flex-1 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <div className="text-center text-white px-8">
          <h1 className="text-5xl font-bold mb-4">Sync</h1>
          <p className="text-xl mb-8">Start Your Journey</p>
          <p className="text-lg opacity-90">
            Build your professional network and discover opportunities
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
