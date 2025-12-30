import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messageService, userService } from '../services/api';
import { FiSearch, FiMessageSquare, FiUser, FiMoreVertical, FiCheckCircle, FiFilter } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import MessageThread from '../components/MessageThread';
import MessageComposer from '../components/MessageComposer';
import ConversationSearch from '../components/ConversationSearch';

const Messages = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'archived'
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    // Add demo conversations if no conversations exist
    if (conversations.length === 0 && !loading) {
      addDemoConversations();
    }
  }, []);

  const addDemoConversations = () => {
    const demoConversations = [
      {
        user_id: 'demo-1',
        user_name: 'Sarah Johnson',
        user_picture: null,
        last_message: {
          content: 'Hey! Thanks for connecting. I saw your post about the job opening.',
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        unread_count: 2,
        updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        user_id: 'demo-2',
        user_name: 'Michael Chen',
        user_picture: null,
        last_message: {
          content: 'Great to meet you! Let\'s schedule a call this week.',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        unread_count: 0,
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: 'demo-3',
        user_name: 'Emily Rodriguez',
        user_picture: null,
        last_message: {
          content: 'I\'d love to learn more about your experience in software development.',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        unread_count: 1,
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: 'demo-4',
        user_name: 'David Kim',
        user_picture: null,
        last_message: {
          content: 'Thanks for sharing that article! Very insightful.',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        unread_count: 0,
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const demoMessages = {
      'demo-1': [
        {
          id: 'msg-1',
          sender_id: 'demo-1',
          receiver_id: user.id,
          content: 'Hey! Thanks for connecting. I saw your post about the job opening.',
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          read_at: null,
        },
        {
          id: 'msg-2',
          sender_id: user.id,
          receiver_id: 'demo-1',
          content: 'Hi Sarah! Yes, I\'m looking for a software engineer position.',
          created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          read_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        },
        {
          id: 'msg-3',
          sender_id: 'demo-1',
          receiver_id: user.id,
          content: 'That\'s great! I might have some opportunities. Can we chat?',
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          read_at: null,
        },
      ],
      'demo-2': [
        {
          id: 'msg-4',
          sender_id: 'demo-2',
          receiver_id: user.id,
          content: 'Great to meet you! Let\'s schedule a call this week.',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        },
        {
          id: 'msg-5',
          sender_id: user.id,
          receiver_id: 'demo-2',
          content: 'Sounds good! I\'m available Tuesday or Wednesday.',
          created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          read_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
        },
      ],
    };

    // Store demo messages in localStorage for persistence
    localStorage.setItem('demoMessages', JSON.stringify(demoMessages));
    localStorage.setItem('demoConversations', JSON.stringify(demoConversations));
    
    setConversations(demoConversations);
    setFilteredConversations(demoConversations);
    
    // Load demo messages if selected user is a demo user
    if (selectedUser && selectedUser.user_id.startsWith('demo-')) {
      const stored = JSON.parse(localStorage.getItem('demoMessages') || '{}');
      setMessages(stored[selectedUser.user_id] || []);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.user_id);
      checkConnectionStatus(selectedUser.user_id);
    }
  }, [selectedUser]);

  useEffect(() => {
    let filtered = conversations;

    // Apply filter
    if (filter === 'unread') {
      filtered = filtered.filter(conv => conv.unread_count > 0);
    }

    // Apply search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(conv =>
        conv.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredConversations(filtered);
  }, [searchQuery, conversations, filter]);

  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('new_message', (data) => {
        if (data.sender_id === selectedUser?.user_id || data.receiver_id === selectedUser?.user_id) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === data.id)) {
              return prev;
            }
            return [...prev, data];
          });
        }
        loadConversations();
      });

      // Listen for typing indicators
      socket.on('typing', (data) => {
        if (data.sender_id === selectedUser?.user_id) {
          if (data.typing) {
            setIsTyping(true);
            setTypingUser(data.sender_id);
          } else {
            setIsTyping(false);
            setTypingUser(null);
          }
        }
      });

      // Listen for read receipts
      socket.on('message_read', (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.message_id ? { ...msg, read_at: data.read_at } : msg
          )
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('typing');
        socket.off('message_read');
      }
    };
  }, [socket, selectedUser]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      
      // Load demo conversations if no real conversations
      const demoConversations = JSON.parse(localStorage.getItem('demoConversations') || '[]');
      const allConversations = [...data, ...demoConversations];
      
      const sorted = allConversations.sort((a, b) => {
        const dateA = a.last_message?.created_at || a.updated_at || 0;
        const dateB = b.last_message?.created_at || b.updated_at || 0;
        return new Date(dateB) - new Date(dateA);
      });
      setConversations(sorted);
      setFilteredConversations(sorted);
      if (sorted.length > 0 && !selectedUser) {
        setSelectedUser(sorted[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // Load demo conversations on error
      const demoConversations = JSON.parse(localStorage.getItem('demoConversations') || '[]');
      if (demoConversations.length > 0) {
        setConversations(demoConversations);
        setFilteredConversations(demoConversations);
        if (!selectedUser) {
          setSelectedUser(demoConversations[0]);
        }
      } else {
      toast.error('Failed to load conversations');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      // Check if it's a demo user
      if (userId.startsWith('demo-')) {
        const stored = JSON.parse(localStorage.getItem('demoMessages') || '{}');
        setMessages(stored[userId] || []);
        return;
      }
      
      const data = await messageService.getConversation(userId);
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      if (error.response?.status === 403) {
        toast.error('You must be connected to message this user');
      } else {
      toast.error('Failed to load messages');
      }
    }
  };

  const checkConnectionStatus = async (userId) => {
    try {
      const status = await userService.getConnectionStatus(userId);
      setConnectionStatuses(prev => ({ ...prev, [userId]: status }));
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const handleSendMessage = async (data) => {
    if (!selectedUser) return;

    try {
      const messageData = {
        receiver_id: selectedUser.user_id,
        content: data.content,
        message_type: 'text',
      };

      // Handle attachments if any
      if (data.attachments && data.attachments.length > 0) {
        for (const file of data.attachments) {
          await messageService.sendMessageWithAttachment(
            selectedUser.user_id,
            data.content || '',
            file
          );
        }
        if (!data.content) return; // If only attachments, return early
      }

      const message = await messageService.sendMessage(messageData);
      setMessages((prev) => [...prev, message]);
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      if (error.response?.status === 403) {
        toast.error('You must be connected to message this user');
      } else {
        toast.error('Failed to send message');
      }
      throw error;
    }
  };

  const handleTyping = () => {
    if (socket && selectedUser && user) {
      socket.emit('typing_start', {
        receiver_id: selectedUser.user_id,
        sender_id: user.id
      });
    }
  };

  const handleTypingStop = () => {
    if (socket && selectedUser && user) {
      socket.emit('typing_stop', {
        receiver_id: selectedUser.user_id,
        sender_id: user.id
      });
    }
  };

  const isConnected = selectedUser
    ? connectionStatuses[selectedUser.user_id]?.status === 'connected'
    : false;

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-96 border-r border-neutral-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-neutral-900">Messages</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Search conversations"
              >
                <FiSearch className="w-5 h-5 text-neutral-600" />
              </button>
              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <FiMoreVertical className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary-100 text-primary-600 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center space-x-1 ${
                filter === 'unread'
                  ? 'bg-primary-100 text-primary-600 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <span>Unread</span>
              {conversations.filter(c => c.unread_count > 0).length > 0 && (
                <span className="bg-primary-600 text-white text-xs rounded-full px-1.5 py-0.5">
                  {conversations.filter(c => c.unread_count > 0).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FiMessageSquare className="w-16 h-16 text-neutral-300 mb-4" />
              <p className="text-neutral-600 font-medium mb-2">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              <p className="text-neutral-500 text-sm">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start a conversation with your connections'}
              </p>
          </div>
          ) : (
            <AnimatePresence>
              {filteredConversations.map((conv) => {
                const isSelected = selectedUser?.user_id === conv.user_id;
                return (
                  <motion.div
                  key={conv.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  onClick={() => setSelectedUser(conv)}
                    className={`p-4 border-b border-neutral-100 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary-50 border-l-4 border-l-primary-600'
                        : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                      <div className="relative">
                    {conv.user_picture ? (
                      <img
                        src={conv.user_picture}
                        alt={conv.user_name}
                            className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-lg">
                        {conv.user_name?.[0] || 'U'}
                            </span>
                      </div>
                    )}
                        {/* Online status indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" title="Online"></div>
                      </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-neutral-900 truncate">
                            {conv.user_name}
                          </h3>
                          {conv.last_message && (
                            <span className="text-xs text-neutral-500 ml-2 flex-shrink-0">
                              {formatDistanceToNow(new Date(conv.last_message.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      <div className="flex items-center justify-between">
                          <p className="text-sm text-neutral-600 truncate flex-1">
                            {conv.last_message?.content || 'No messages yet'}
                          </p>
                        {conv.unread_count > 0 && (
                            <span className="ml-2 bg-primary-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            )}
          </div>
        </div>

        {/* Chat Window */}
      <div className="flex-1 flex flex-col min-w-0">
          {selectedUser ? (
          <MessageThread
            messages={messages}
            currentUserId={user.id}
            otherUser={{
              id: selectedUser.user_id,
              first_name: selectedUser.user_name?.split(' ')[0] || '',
              last_name: selectedUser.user_name?.split(' ').slice(1).join(' ') || '',
              profile_picture: selectedUser.user_picture,
            }}
            onSend={handleSendMessage}
            onTyping={handleTyping}
            onTypingStop={handleTypingStop}
            typing={isTyping && typingUser === selectedUser.user_id}
            isConnected={isConnected}
            loading={loading}
                    />
                  ) : (
          <div className="flex-1 flex items-center justify-center bg-neutral-50">
            <div className="text-center p-8">
              <FiMessageSquare className="w-20 h-20 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-neutral-600">
                Choose a conversation from the list to start messaging
                          </p>
                        </div>
                      </div>
                )}
              </div>

      {/* Search Modal */}
      {showSearchModal && (
        <ConversationSearch
          conversations={conversations}
          onSelectConversation={setSelectedUser}
          onClose={() => setShowSearchModal(false)}
        />
          )}
    </div>
  );
};

export default Messages;
