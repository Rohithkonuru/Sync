import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMessageSquare, FiUserX, FiSearch, FiX, FiMapPin } from 'react-icons/fi';
import { userService } from '../services/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHelpers';

/**
 * My Connections List Component
 * Displays paginated list of connections with search/filter and unfriend action
 * Includes animations and undo functionality
 * 
 * Usage:
 * <MyConnectionsList 
 *   connections={connections} 
 *   onRemove={handleRemove}
 *   onUpdate={handleUpdate}
 * />
 */
const MyConnectionsList = ({ 
  connections = [], 
  onRemove,
  onUpdate,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  loading = false
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [undoActions, setUndoActions] = useState({});

  // Filter connections based on search
  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) {
      return connections;
    }
    const query = searchQuery.toLowerCase();
    return connections.filter(conn => 
      `${conn.first_name} ${conn.last_name}`.toLowerCase().includes(query) ||
      conn.headline?.toLowerCase().includes(query) ||
      conn.location?.toLowerCase().includes(query) ||
      conn.skills?.some(skill => skill.toLowerCase().includes(query))
    );
  }, [connections, searchQuery]);

  const handleUnfriend = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from your connections?`)) {
      return;
    }

    // Optimistic update
    const connection = connections.find(c => c.id === userId);
    const updatedConnections = connections.filter(c => c.id !== userId);
    onUpdate(updatedConnections);

    // Store undo action
    const undoAction = () => {
      onUpdate([...updatedConnections, connection]);
      delete undoActions[`remove_${userId}`];
      setUndoActions(prev => {
        const newActions = { ...prev };
        delete newActions[`remove_${userId}`];
        return newActions;
      });
    };
    setUndoActions(prev => ({ ...prev, [`remove_${userId}`]: undoAction }));

    setRemovingId(userId);

    toast.success(
      (t) => (
        <div className="flex items-center space-x-2">
          <span>Connection removed</span>
          <button
            onClick={() => {
              undoAction();
              toast.dismiss(t.id);
            }}
            className="text-primary-600 font-medium hover:underline"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000 }
    );

    try {
      await userService.removeConnectionNew(userId);
      // Clear undo after 5 seconds
      setTimeout(() => {
        delete undoActions[`remove_${userId}`];
        setUndoActions(prev => {
          const newActions = { ...prev };
          delete newActions[`remove_${userId}`];
          return newActions;
        });
      }, 5000);
      if (onRemove) {
        onRemove(userId);
      }
    } catch (error) {
      // Revert on error
      undoAction();
      toast.error(getErrorMessage(error) || 'Failed to remove connection');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading && connections.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-12">
        <FiUser className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Connections</h3>
        <p className="text-neutral-500">Start connecting with professionals to build your network.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search connections by name, headline, location, or skills..."
          className="w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          aria-label="Search connections"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            aria-label="Clear search"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-neutral-600">
          {filteredConnections.length} {filteredConnections.length === 1 ? 'connection' : 'connections'} found
        </p>
      )}

      {/* Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredConnections.map((connection) => (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: -100 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-neutral-200 shadow-soft hover:shadow-medium transition-all p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => navigate(`/profile/${connection.id}`)}
                >
                  {connection.profile_picture ? (
                    <img
                      src={connection.profile_picture}
                      alt={connection.first_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <FiUser className="w-6 h-6 text-primary-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 truncate">
                      {connection.first_name} {connection.last_name}
                    </h3>
                    {connection.headline && (
                      <p className="text-sm text-neutral-600 truncate">{connection.headline}</p>
                    )}
                    {connection.location && (
                      <div className="flex items-center space-x-1 mt-1">
                        <FiMapPin className="w-3 h-3 text-neutral-400" />
                        <p className="text-xs text-neutral-500 truncate">{connection.location}</p>
                      </div>
                    )}
                  </div>
                </div>
                <motion.button
                  onClick={() => handleUnfriend(connection.id, `${connection.first_name} ${connection.last_name}`)}
                  disabled={removingId === connection.id}
                  className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Remove connection"
                  title="Remove connection"
                >
                  {removingId === connection.id ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-error-600 border-t-transparent rounded-full"
                    />
                  ) : (
                    <FiUserX className="w-5 h-5" />
                  )}
                </motion.button>
              </div>

              {/* Skills */}
              {connection.skills && connection.skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {connection.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                    {connection.skills.length > 3 && (
                      <span className="px-2 py-1 text-neutral-500 text-xs">
                        +{connection.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <motion.button
                  onClick={() => navigate(`/profile/${connection.id}`)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Profile
                </motion.button>
                <motion.button
                  onClick={() => navigate(`/messages?user=${connection.id}`)}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center justify-center space-x-1 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiMessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty Search Results */}
      {searchQuery && filteredConnections.length === 0 && (
        <div className="text-center py-12">
          <FiSearch className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-500">No connections found matching "{searchQuery}"</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-neutral-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyConnectionsList;

