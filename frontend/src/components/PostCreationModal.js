import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PostComposer from './PostComposer';

const getComposerMode = (postType) => {
  if (postType === 'video') return 'video';
  if (postType === 'article') return 'article';
  if (postType === 'event') return 'event';
  return 'text';
};

const getTitle = (postType) => {
  if (postType === 'photo') return 'Create Photo Post';
  if (postType === 'video') return 'Create Video Post';
  if (postType === 'article') return 'Write Article';
  if (postType === 'event') return 'Create Event';
  return 'Create Post';
};

const PostCreationModal = ({ isOpen, onClose, postType = 'text', onSubmit }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{getTitle(postType)}</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                x
              </button>
            </div>
            <div className="p-4">
              <PostComposer
                mode={getComposerMode(postType)}
                onSubmit={onSubmit}
                placeholder={postType === 'photo' ? 'Share the story behind this photo...' : "What's on your mind?"}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostCreationModal;
