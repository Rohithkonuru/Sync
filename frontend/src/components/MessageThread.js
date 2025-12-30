import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiClock, FiMoreVertical, FiThumbsUp, FiShare2 } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import MessageComposer from './MessageComposer';
import MessageAttachment from './MessageAttachment';

/**
 * Message Thread Component
 * Displays messages in a conversation with read receipts, typing indicators, and timestamps
 * 
 * Usage:
 * <MessageThread
 *   messages={messages}
 *   currentUserId={user.id}
 *   otherUser={otherUser}
 *   onSend={handleSend}
 *   onTyping={handleTyping}
 *   typing={isTyping}
 *   isConnected={isConnected}
 * />
 */
const MessageThread = ({
  messages = [],
  currentUserId,
  otherUser,
  onSend,
  onTyping,
  onTypingStop,
  typing = false,
  isConnected = false,
  loading = false
}) => {
  const messagesEndRef = useRef(null);
  const [localMessages, setLocalMessages] = useState(messages);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, typing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (data) => {
    if (!isConnected) {
      return;
    }
    try {
      await onSend(data);
      // Optimistically add message to local state
      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender_id: currentUserId,
        receiver_id: otherUser?.id,
        content: data.content,
        created_at: new Date().toISOString(),
        read_at: null,
        status: 'sending'
      };
      setLocalMessages(prev => [...prev, tempMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getMessageStatus = (message) => {
    if (message.status === 'sending') {
      return { icon: <FiClock className="w-3 h-3" />, text: 'Sending...', color: 'text-neutral-400' };
    }
    if (message.read_at) {
      return { 
        icon: (
          <span className="flex items-center">
            <FiCheck className="w-3 h-3" />
            <FiCheck className="w-3 h-3 -ml-1.5" />
          </span>
        ), 
        text: 'Read', 
        color: 'text-primary-600' 
      };
    }
    if (message.created_at) {
      return { icon: <FiCheck className="w-3 h-3" />, text: 'Delivered', color: 'text-neutral-400' };
    }
    return null;
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50">
        <div className="text-center p-8">
          <p className="text-neutral-600 text-lg mb-2">You must be connected to message</p>
          <p className="text-neutral-500 text-sm">Send a connection request to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
          {otherUser?.profile_picture ? (
            <img
              src={otherUser.profile_picture}
              alt={otherUser.first_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {otherUser?.first_name?.[0] || 'U'}
              </span>
            </div>
          )}
            {/* Online status indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" title="Online"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-neutral-900">
              {otherUser?.first_name} {otherUser?.last_name}
            </h3>
              <span className="text-xs text-neutral-500">• Active now</span>
            </div>
            {typing && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-primary-600"
              >
                typing...
              </motion.p>
            )}
          </div>
        </div>
        <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
          <FiMoreVertical className="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && localMessages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : localMessages.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {localMessages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const showTimestamp = index === 0 || 
                new Date(message.created_at) - new Date(localMessages[index - 1].created_at) > 5 * 60 * 1000;
              const status = getMessageStatus(message);

              return (
                <React.Fragment key={message.id || index}>
                  {showTimestamp && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-neutral-500 bg-neutral-200 px-3 py-1 rounded-full">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: isOwn ? 100 : -100 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                    onMouseEnter={() => setHoveredMessage(message.id)}
                    onMouseLeave={() => setHoveredMessage(null)}
                  >
                    <div className="flex flex-col items-end">
                    <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative ${
                        isOwn
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-sm'
                      }`}
                    >
                        {/* Message Actions */}
                        {hoveredMessage === message.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`absolute ${isOwn ? 'left-0 -translate-x-full mr-2' : 'right-0 translate-x-full ml-2'} top-0 flex items-center space-x-1 bg-white shadow-lg rounded-lg p-1 border border-neutral-200`}
                          >
                            <button
                              onClick={() => {
                                setMessageReactions(prev => ({
                                  ...prev,
                                  [message.id]: (prev[message.id] || 0) + 1
                                }));
                              }}
                              className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
                              title="React"
                            >
                              <FiThumbsUp className="w-4 h-4 text-neutral-600" />
                            </button>
                            <button
                              className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
                              title="Forward"
                            >
                              <FiShare2 className="w-4 h-4 text-neutral-600" />
                            </button>
                          </motion.div>
                        )}

                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((att, idx) => (
                            <MessageAttachment
                              key={idx}
                              attachment={att}
                              isOwn={isOwn}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Attachment URL (for backward compatibility) */}
                      {message.attachment_url && !message.attachments && (
                        <MessageAttachment
                          attachment={{
                            url: message.attachment_url,
                            name: message.attachment_name || 'Attachment',
                            type: message.attachment_type,
                          }}
                          isOwn={isOwn}
                        />
                      )}

                      {/* Timestamp and Status */}
                      <div className={`flex items-center space-x-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span
                          className={`text-xs ${
                            isOwn ? 'text-primary-100' : 'text-neutral-500'
                          }`}
                        >
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {isOwn && status && (
                          <span className={status.color} title={status.text}>
                            {status.icon}
                          </span>
                        )}
                      </div>
                      </div>

                      {/* Reactions */}
                      {messageReactions[message.id] > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 flex items-center space-x-1"
                        >
                          <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-600">
                            👍 {messageReactions[message.id]}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        )}
        
        {/* Typing Indicator */}
        {typing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-sm px-4 py-2">
              <div className="flex space-x-1">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-neutral-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-neutral-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-neutral-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <MessageComposer
        onSend={handleSend}
        onTyping={onTyping}
        onTypingStop={onTypingStop}
        disabled={!isConnected}
        placeholder={`Message ${otherUser?.first_name || 'user'}...`}
      />
    </div>
  );
};

export default MessageThread;
