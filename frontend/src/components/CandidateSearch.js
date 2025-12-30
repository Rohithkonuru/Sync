import React, { useState } from 'react';
import { userService } from '../services/api';
import { FiSearch, FiX, FiUser, FiMapPin, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CandidateSearch = ({ onSelectCandidate, onClose }) => {
  const [filters, setFilters] = useState({
    query: '',
    user_type: 'job_seeker',
    location: '',
    skills: '',
    experience_years_min: '',
    experience_years_max: '',
    role: ''
  });
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });
      const data = await userService.searchUsers(params);
      setCandidates(data || []);
    } catch (error) {
      toast.error('Failed to search candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Search Candidates</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        {/* Search Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Name, skills, keywords..."
                value={filters.query}
                onChange={(e) => setFilters({...filters, query: e.target.value})}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="City, State"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <input
              type="text"
              placeholder="Comma-separated (e.g., JavaScript, React, Python)"
              value={filters.skills}
              onChange={(e) => setFilters({...filters, skills: e.target.value})}
              onKeyPress={handleKeyPress}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
            <select
              value={filters.user_type}
              onChange={(e) => setFilters({...filters, user_type: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="job_seeker">Job Seeker</option>
              <option value="professional">Professional</option>
              <option value="student">Student</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience (years)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={filters.experience_years_min}
              onChange={(e) => setFilters({...filters, experience_years_min: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Experience (years)</label>
            <input
              type="number"
              min="0"
              placeholder="50"
              value={filters.experience_years_max}
              onChange={(e) => setFilters({...filters, experience_years_max: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 mb-6 flex items-center justify-center space-x-2"
        >
          <FiSearch className="w-5 h-5" />
          <span>{loading ? 'Searching...' : 'Search Candidates'}</span>
        </button>

        {/* Results */}
        {candidates.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Results ({candidates.length})</h3>
            {candidates.map(candidate => (
              <div key={candidate.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {candidate.profile_picture ? (
                      <img 
                        src={candidate.profile_picture} 
                        alt={candidate.first_name} 
                        className="w-16 h-16 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-semibold">
                        {candidate.first_name?.[0] || 'U'}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {candidate.first_name} {candidate.last_name}
                      </h3>
                      <p className="text-gray-600">{candidate.headline || 'No headline'}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        {candidate.location && (
                          <span className="flex items-center space-x-1">
                            <FiMapPin className="w-4 h-4" />
                            <span>{candidate.location}</span>
                          </span>
                        )}
                        {candidate.experience_years !== undefined && (
                          <span className="flex items-center space-x-1">
                            <FiBriefcase className="w-4 h-4" />
                            <span>{candidate.experience_years} years</span>
                          </span>
                        )}
                      </div>
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {candidate.skills.slice(0, 5).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => {
                        if (onSelectCandidate) {
                          onSelectCandidate(candidate);
                        }
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && candidates.length === 0 && filters.query && (
          <div className="text-center py-8 text-gray-500">
            <FiUser className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No candidates found. Try adjusting your search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateSearch;

