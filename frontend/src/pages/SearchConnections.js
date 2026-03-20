import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { FiSearch, FiUser, FiUserPlus, FiUserCheck, FiX, FiFilter, FiMapPin, FiAward, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SearchConnections = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedConnections, setSuggestedConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [sendingRequest, setSendingRequest] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    userType: '',
    location: '',
    skill: ''
  });
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'suggested'
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Load suggested connections on mount
  useEffect(() => {
    loadSuggestedConnections();
  }, []);

  const loadSuggestedConnections = async () => {
    try {
      const suggestions = await userService.getSuggestions();
      setSuggestedConnections(suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestedConnections([]);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = {
        query,
        limit: 50,
        ...filters
      };
      const response = await userService.searchUsers(params);
      setSearchResults(response || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed - try again');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    if (!userId) return;
    
    setSendingRequest(prev => ({ ...prev, [userId]: true }));
    try {
      await userService.sendConnectionRequest(userId);
      setConnectionStatus(prev => ({ ...prev, [userId]: 'pending' }));
      toast.success('Connection request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setSendingRequest(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleMessage = (userId) => {
    navigate(`/messages?userId=${userId}`);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const PersonCard = ({ person, isSuggested = false }) => {
    const personId = person._id || person.id;
    const status = connectionStatus[personId];
    const isSending = sendingRequest[personId];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        onClick={() => setSelectedPerson(person)}
        className="bg-white rounded-xl p-4 border border-neutral-200 hover:shadow-lg transition-all cursor-pointer"
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {person.profile_picture ? (
              <img
                src={person.profile_picture}
                alt={`${person.first_name} ${person.last_name}`}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                {getInitials(person.first_name, person.last_name)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 line-clamp-1">
              {person.first_name} {person.last_name}
            </h3>
            {person.headline && (
              <p className="text-sm text-neutral-600 line-clamp-1">{person.headline}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {person.location && (
                <div className="flex items-center gap-1 text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full">
                  <FiMapPin className="w-3 h-3" />
                  {person.location}
                </div>
              )}
              {person.skills && person.skills[0] && (
                <div className="flex items-center gap-1 text-xs text-neutral-600 bg-blue-100 px-2 py-1 rounded-full">
                  <FiAward className="w-3 h-3" />
                  {person.skills[0]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100">
          {status === 'pending' ? (
            <button
              disabled
              className="flex-1 px-3 py-2 bg-neutral-100 text-neutral-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <FiUserCheck className="w-4 h-4" />
              Pending
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConnect(personId);
              }}
              disabled={isSending}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiUserPlus className="w-4 h-4" />
              {isSending ? 'Sending...' : 'Connect'}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMessage(personId);
            }}
            className="flex-1 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 flex items-center justify-center gap-2"
          >
            <FiMessageCircle className="w-4 h-4" />
            Message
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-neutral-100 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-neutral-900">Find Connections</h1>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search name, skills, headline..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-200 rounded"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tabs & Filters */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'search'
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setActiveTab('suggested')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'suggested'
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Suggested
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-neutral-100 rounded-lg flex items-center gap-1 text-sm text-neutral-600"
            >
              <FiFilter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-neutral-200 space-y-3"
              >
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => {
                    setFilters({ ...filters, location: e.target.value });
                    if (searchQuery) handleSearch(searchQuery);
                  }}
                  className="w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Filter by skill..."
                  value={filters.skill}
                  onChange={(e) => {
                    setFilters({ ...filters, skill: e.target.value });
                    if (searchQuery) handleSearch(searchQuery);
                  }}
                  className="w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filters.userType}
                  onChange={(e) => {
                    setFilters({ ...filters, userType: e.target.value });
                    if (searchQuery) handleSearch(searchQuery);
                  }}
                  className="w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All User Types</option>
                  <option value="student">Student</option>
                  <option value="job_seeker">Job Seeker</option>
                  <option value="professional">Professional</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'search' ? (
          <>
            {!searchQuery ? (
              <div className="text-center py-16">
                <FiUser className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">Find People to Connect With</h2>
                <p className="text-neutral-600">Search by name, skills, headline, or location</p>
              </div>
            ) : loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-neutral-200 animate-pulse h-28 rounded-xl"></div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <FiUser className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600">No people found matching your search</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 font-medium">Found {searchResults.length} people</p>
                <div className="space-y-4">
                  {searchResults.map((person) => (
                    <PersonCard key={person._id || person.id} person={person} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {suggestedConnections.length === 0 ? (
              <div className="text-center py-16">
                <FiAward className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">No suggestions yet</h2>
                <p className="text-neutral-600">Complete your profile to get better suggestions</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 font-medium">
                  {suggestedConnections.length} people you might know
                </p>
                <div className="space-y-4">
                  {suggestedConnections.map((person) => (
                    <PersonCard key={person._id || person.id} person={person} isSuggested={true} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Person Detail Modal */}
      <AnimatePresence>
        {selectedPerson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedPerson(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">Profile</h2>
                <button onClick={() => setSelectedPerson(null)}>
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4">
                {/* Cover & Avatar */}
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-24 rounded-xl mb-6 relative">
                  <div className="absolute -bottom-8 left-4">
                    {selectedPerson.profile_picture ? (
                      <img
                        src={selectedPerson.profile_picture}
                        alt={`${selectedPerson.first_name} ${selectedPerson.last_name}`}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-2xl border-4 border-white">
                        {getInitials(selectedPerson.first_name, selectedPerson.last_name)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-neutral-900">
                    {selectedPerson.first_name} {selectedPerson.last_name}
                  </h3>
                  {selectedPerson.headline && (
                    <p className="text-neutral-600 font-medium mt-1">{selectedPerson.headline}</p>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {selectedPerson.location && (
                      <div className="bg-neutral-50 p-3 rounded-lg">
                        <p className="text-xs text-neutral-600">Location</p>
                        <p className="font-medium text-neutral-900 flex items-center gap-1 mt-1">
                          <FiMapPin className="w-4 h-4" />
                          {selectedPerson.location}
                        </p>
                      </div>
                    )}
                    {selectedPerson.skills && selectedPerson.skills.length > 0 && (
                      <div className="bg-neutral-50 p-3 rounded-lg">
                        <p className="text-xs text-neutral-600">Top Skill</p>
                        <p className="font-medium text-neutral-900 flex items-center gap-1 mt-1">
                          <FiAward className="w-4 h-4" />
                          {selectedPerson.skills[0]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {selectedPerson.bio && (
                    <div className="mt-4">
                      <p className="text-sm text-neutral-700">{selectedPerson.bio}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedPerson.skills && selectedPerson.skills.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPerson.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-6">
                    {connectionStatus[selectedPerson._id || selectedPerson.id] === 'pending' ? (
                      <button
                        disabled
                        className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-600 rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <FiUserCheck className="w-5 h-5" />
                        Pending
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(selectedPerson._id || selectedPerson.id)}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <FiUserPlus className="w-5 h-5" />
                        Connect
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleMessage(selectedPerson._id || selectedPerson.id);
                        setSelectedPerson(null);
                      }}
                      className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 flex items-center justify-center gap-2"
                    >
                      <FiMessageCircle className="w-5 h-5" />
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchConnections;
