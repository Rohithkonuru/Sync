import React, { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiSearch, FiMessageCircle, FiUserPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Communities = () => {
  const [communities, setCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: 'professional'
  });

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      // TODO: Implement API call to load communities
      // For now, using mock data
      setCommunities([
        {
          id: 1,
          name: 'Tech Professionals Network',
          description: 'Connect with fellow tech professionals',
          category: 'technology',
          members: 1250,
          isJoined: true
        },
        {
          id: 2,
          name: 'Job Seekers Hub',
          description: 'Share job opportunities and career advice',
          category: 'career',
          members: 890,
          isJoined: false
        },
        {
          id: 3,
          name: 'Startup Founders',
          description: 'Building the next big thing together',
          category: 'business',
          members: 567,
          isJoined: true
        }
      ]);
    } catch (error) {
      toast.error('Failed to load communities');
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      // TODO: Implement API call to create community
      toast.success('Community created successfully!');
      setShowCreateForm(false);
      setNewCommunity({ name: '', description: '', category: 'professional' });
      loadCommunities();
    } catch (error) {
      toast.error('Failed to create community');
    }
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      // TODO: Implement API call to join community
      setCommunities(prev =>
        prev.map(comm =>
          comm.id === communityId
            ? { ...comm, isJoined: true, members: comm.members + 1 }
            : comm
        )
      );
      toast.success('Joined community successfully!');
    } catch (error) {
      toast.error('Failed to join community');
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    try {
      // TODO: Implement API call to leave community
      setCommunities(prev =>
        prev.map(comm =>
          comm.id === communityId
            ? { ...comm, isJoined: false, members: comm.members - 1 }
            : comm
        )
      );
      toast.success('Left community successfully!');
    } catch (error) {
      toast.error('Failed to leave community');
    }
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FiUsers className="w-8 h-8 mr-3 text-primary-600" />
            Communities
          </h1>
          <p className="text-gray-600 mt-2">Connect with people who share your interests</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <FiPlus className="w-4 h-4" />
          <span>Create Community</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommunities.map((community) => (
          <div key={community.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{community.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{community.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="capitalize bg-gray-100 px-2 py-1 rounded">{community.category}</span>
                  <span>{community.members} members</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {community.isJoined ? (
                <>
                  <button className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-1">
                    <FiMessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                  <button
                    onClick={() => handleLeaveCommunity(community.id)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Leave
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleJoinCommunity(community.id)}
                  className="w-full px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-1"
                >
                  <FiUserPlus className="w-4 h-4" />
                  <span>Join Community</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Community Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Community</h2>
            <form onSubmit={handleCreateCommunity}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  required
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter community name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Describe your community"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newCommunity.category}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="professional">Professional</option>
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="career">Career</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communities;
