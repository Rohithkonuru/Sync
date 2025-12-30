import React from 'react';
import { motion } from 'framer-motion';
import { FiFile, FiImage, FiDownload, FiX } from 'react-icons/fi';

const MessageAttachment = ({ attachment, onRemove, isOwn = false }) => {
  const isImage = attachment.type?.startsWith('image/') || attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const handleDownload = () => {
    if (attachment.url) {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name || 'attachment';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isImage) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group mt-2 rounded-lg overflow-hidden"
      >
        <img
          src={attachment.url || attachment.preview}
          alt={attachment.name || 'Image attachment'}
          className="max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(attachment.url || attachment.preview, '_blank')}
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
            aria-label="Remove attachment"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mt-2 flex items-center space-x-3 p-3 rounded-lg border ${
        isOwn
          ? 'bg-primary-50 border-primary-200'
          : 'bg-neutral-100 border-neutral-200'
      }`}
    >
      <div className={`p-2 rounded-lg ${
        isOwn ? 'bg-primary-100' : 'bg-white'
      }`}>
        <FiFile className={`w-5 h-5 ${
          isOwn ? 'text-primary-600' : 'text-neutral-600'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isOwn ? 'text-primary-900' : 'text-neutral-900'
        }`}>
          {attachment.name || 'File attachment'}
        </p>
        {attachment.size && (
          <p className={`text-xs ${
            isOwn ? 'text-primary-600' : 'text-neutral-500'
          }`}>
            {(attachment.size / 1024).toFixed(1)} KB
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {attachment.url && (
          <button
            onClick={handleDownload}
            className={`p-2 rounded-lg hover:bg-opacity-80 transition-colors ${
              isOwn
                ? 'bg-primary-200 text-primary-700 hover:bg-primary-300'
                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
            }`}
            title="Download"
          >
            <FiDownload className="w-4 h-4" />
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className={`p-2 rounded-lg hover:bg-opacity-80 transition-colors ${
              isOwn
                ? 'bg-primary-200 text-primary-700 hover:bg-primary-300'
                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
            }`}
            title="Remove"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default MessageAttachment;
