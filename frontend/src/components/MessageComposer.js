import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiImage, FiPaperclip, FiX, FiSmile } from 'react-icons/fi';
import toast from 'react-hot-toast';
import EmojiPicker from './EmojiPicker';

/**
 * Message Composer Component
 * Supports text messages, attachments (images/PDF), and copy/paste detection
 * Includes typing indicator support
 * 
 * Usage:
 * <MessageComposer
 *   onSend={handleSend}
 *   onTyping={handleTyping}
 *   disabled={!isConnected}
 * />
 */
const MessageComposer = ({ 
  onSend, 
  onTyping,
  onTypingStop,
  disabled = false,
  placeholder = "Type a message...",
  maxLength = 2000
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiButtonRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
      
      // Typing indicator
      if (value.trim() && !isTyping) {
        setIsTyping(true);
        if (onTyping) {
          onTyping();
        }
      }

      // Clear typing indicator after 3 seconds of no typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (onTypingStop) {
          onTypingStop();
        }
      }, 3000);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        handleFileSelect([file], 'image');
      }
    }
  };

  const handleFileSelect = async (files, type = 'file') => {
    const fileArray = Array.from(files);
    const validFiles = [];

    for (const file of fileArray) {
      // Validate file type
      if (type === 'image') {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB size limit`);
        continue;
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachments(prev => [...prev, {
            file,
            preview: reader.result,
            type: 'image',
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        validFiles.push({
          file,
          type: 'file',
          name: file.name
        });
      }
    }

    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && attachments.length === 0) {
      return;
    }

    if (message.length > maxLength) {
      toast.error(`Message exceeds ${maxLength} characters`);
      return;
    }

    // Stop typing indicator
    setIsTyping(false);
    if (onTypingStop) {
      onTypingStop();
    }

    try {
      await onSend({
        content: message.trim(),
        attachments: attachments.map(att => att.file)
      });
      setMessage('');
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target) &&
        showEmojiPicker
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <div className="border-t border-neutral-200 bg-white p-4 relative">
      {/* Attachment Previews */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex flex-wrap gap-2"
          >
            {attachments.map((attachment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <div className="relative">
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className="w-20 h-20 object-cover rounded-lg border border-neutral-200"
                    />
                    <button
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-2 -right-2 p-1 bg-error-600 text-white rounded-full hover:bg-error-700 transition-colors"
                      aria-label="Remove attachment"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative px-3 py-2 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center space-x-2">
                    <FiPaperclip className="w-4 h-4 text-neutral-600" />
                    <span className="text-xs text-neutral-700 truncate max-w-[100px]">
                      {attachment.name}
                    </span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="p-1 hover:bg-neutral-200 rounded"
                      aria-label="Remove attachment"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={handleInputChange}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            maxLength={maxLength}
            className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '48px', maxHeight: '120px' }}
            aria-label="Message input"
          />
          <div className="absolute bottom-2 right-2 text-xs text-neutral-400">
            {message.length}/{maxLength}
          </div>
        </div>

        <div className="flex items-center space-x-2 relative">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
            multiple
            onChange={(e) => handleFileSelect(Array.from(e.target.files), 'image')}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            multiple
            onChange={(e) => handleFileSelect(Array.from(e.target.files), 'file')}
            className="hidden"
          />

          <motion.button
            ref={emojiButtonRef}
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className={`p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 ${
              showEmojiPicker ? 'bg-primary-50 text-primary-600' : ''
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Add emoji"
            aria-label="Add emoji"
          >
            <FiSmile className="w-5 h-5" />
          </motion.button>

          <motion.button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled}
            className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Attach image"
            aria-label="Attach image"
          >
            <FiImage className="w-5 h-5" />
          </motion.button>

          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Attach file"
            aria-label="Attach file"
          >
            <FiPaperclip className="w-5 h-5" />
          </motion.button>

          <motion.button
            type="submit"
            disabled={disabled || (!message.trim() && attachments.length === 0)}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Send message"
          >
            <FiSend className="w-5 h-5" />
          </motion.button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2">
              <EmojiPicker
                isOpen={showEmojiPicker}
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default MessageComposer;

