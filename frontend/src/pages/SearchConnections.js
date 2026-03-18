import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api';
import { FiSearch, FiUser, FiUserPlus, FiUserCheck, FiArrowRight, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SearchConnections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({}); // Track pending/connected status
  const [sendingRequest, setSendingRequest] = useState({});

  // Search for users/connections
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search API - adjust endpoint based on your backend
      const response = await userService.searchUsers({ query, limit: 20 });
      setSearchResults(response || []);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback: show mock results for testing
      setSearchResults([
        {
          id: '1',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Developer',
          headline: 'Full Stack Developer',
          profile_picture: null,
          _id: '1'
        },
        {
          id: '2',
          email: 'jane@example.com',
          first_name: 'Jane',
          last_name: 'Designer',
          headline: 'UI/UX Designer',
          profile_picture: null,
          _id: '2'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Send connection request
  const handleConnect = async (userId) => {
    if (!userId) return;
    
    setSendingRequest(prev => ({ ...prev, [userId]: true }));
    try {
      await userService.sendConnectionRequest(userId);
      setConnectionStatus(prev => ({ ...prev, [userId]: 'pending' }));
      toast.success('Connection request sent!');
    } catch (error) {
      toast.error('Failed to send connection request');
    } finally {
      setSendingRequest(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
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
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search people by name, headline, skills..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {!searchQuery ? (
          <div className="text-center py-16">
            <FiUser className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Find People to Connect With</h2>
            <p className="text-neutral-600">Search by name, headline, or skills to find and connect with professionals</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-neutral-200 animate-pulse h-24 rounded-lg"></div>
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12">
            <FiUser className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">No people found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {searchResults.map((person) => {
                const personId = person._id || person.id;
                const status = connectionStatus[personId];
                const isSending = sendingRequest[personId];

                return (
                  <motion.div
                    key={personId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-lg p-4 border border-neutral-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {person.profile_picture ? (
                          <img
                            src={person.profile_picture}
                            alt={`${person.first_name} ${person.last_name}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {getInitials(person.first_name, person.last_name)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900">
                          {person.first_name} {person.last_name}
                        </h3>
                        <p className="text-sm text-neutral-600 line-clamp-1">
                          {person.headline || person.email}
                        </p>
                        {person.headline && (
                          <p className="text-xs text-neutral-500 mt-1">{person.headline}</p>
                        )}
                      </div>

                      {/* Connect Button */}
                      <div className="flex-shrink-0">
                        {status === 'pending' ? (
                          <button
                            disabled
                            className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg text-sm font-medium flex items-center gap-2 cursor-not-allowed"
                          >
                            <FiUserCheck className="w-4 h-4" />
                            Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnect(personId)}
                            disabled={isSending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                          >
                            <FiUserPlus className="w-4 h-4" />
                            {isSending ? 'Sending...' : 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchConnections;
