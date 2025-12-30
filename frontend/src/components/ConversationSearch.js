import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX } from 'react-icons/fi';

const ConversationSearch = ({ conversations, onSelectConversation, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = conversations.filter(conv =>
        conv.user_name?.toLowerCase().includes(query.toLowerCase()) ||
        conv.last_message?.content?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        >
          {/* Search Input */}
          <div className="p-4 border-b border-neutral-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search conversations and messages..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {searchQuery.trim() ? (
              searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((conv) => (
                    <motion.div
                      key={conv.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        onSelectConversation(conv);
                        onClose();
                      }}
                      className="p-3 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {conv.user_picture ? (
                          <img
                            src={conv.user_picture}
                            alt={conv.user_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {conv.user_name?.[0] || 'U'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-neutral-900 truncate">
                            {conv.user_name}
                          </h4>
                          {conv.last_message && (
                            <p className="text-sm text-neutral-600 truncate">
                              {conv.last_message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-600">No conversations found</p>
                  <p className="text-sm text-neutral-500 mt-2">
                    Try a different search term
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <FiSearch className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">Start typing to search conversations</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConversationSearch;
