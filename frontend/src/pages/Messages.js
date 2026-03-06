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
    if (user) {
      loadConversations();
    }
  }, [user]);

  const generateDemoConversations = () => {
    // If user is not available, we can still generate demo conversations 
    // but we need a placeholder for the current user id
    const currentUserId = user?.id || 'current-user';

    const demoConversations = [
      {
        user_id: 'demo-1',
        user_name: 'Sarah Johnson',
        user_picture: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random',
        last_message: {
          content: 'Hi! I noticed your profile and thought you would be a great fit for our Senior React Developer role.',
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        unread_count: 1,
        updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        user_id: 'demo-2',
        user_name: 'Michael Chen',
        user_picture: 'https://ui-avatars.com/api/?name=Michael+Chen&background=random',
        last_message: {
          content: 'Thanks for the connection request! I would love to discuss the project details.',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        unread_count: 0,
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: 'demo-3',
        user_name: 'Emily Rodriguez',
        user_picture: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=random',
        last_message: {
          content: 'Are you available for a quick call tomorrow at 10 AM?',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        unread_count: 3,
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: 'demo-4',
        user_name: 'David Kim',
        user_picture: 'https://ui-avatars.com/api/?name=David+Kim&background=random',
        last_message: {
          content: 'I have reviewed your portfolio, and it looks impressive! Great work on the dashboard project.',
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
          receiver_id: currentUserId,
          content: 'Hi! I noticed your profile and thought you would be a great fit for our Senior React Developer role.',
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          read_at: null,
        }
      ],
      'demo-2': [
        {
          id: 'msg-4',
          sender_id: 'demo-2',
          receiver_id: currentUserId,
          content: 'Great to meet you! Let\'s schedule a call this week.',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        },
        {
          id: 'msg-5',
          sender_id: currentUserId,
          receiver_id: 'demo-2',
          content: 'Sounds good! I\'m available Tuesday or Wednesday.',
          created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          read_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
        },
        {
            id: 'msg-6',
            sender_id: 'demo-2',
            receiver_id: currentUserId,
            content: 'Thanks for the connection request! I would love to discuss the project details.',
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            read_at: null,
        }
      ],
      'demo-3': [
          {
              id: 'msg-7',
              sender_id: 'demo-3',
              receiver_id: currentUserId,
              content: 'Are you available for a quick call tomorrow at 10 AM?',
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              read_at: null,
          }
      ],
      'demo-4': [
          {
              id: 'msg-8',
              sender_id: 'demo-4',
              receiver_id: currentUserId,
              content: 'I have reviewed your portfolio, and it looks impressive! Great work on the dashboard project.',
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              read_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
          }
      ]
    };

    // Store demo messages in localStorage for persistence
    localStorage.setItem('demoMessages', JSON.stringify(demoMessages));
    localStorage.setItem('demoConversations', JSON.stringify(demoConversations));
    
    return demoConversations;
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
  }, [socket, selectedUser, user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      let data = [];
      try {
        if (user) {
            data = await messageService.getConversations();
        }
      } catch (err) {
        console.warn('Failed to fetch conversations from API', err);
      }
      
      // Load demo conversations if no real conversations
      let demoConversations = JSON.parse(localStorage.getItem('demoConversations') || '[]');
      
      if (data.length === 0 && demoConversations.length === 0) {
        demoConversations = generateDemoConversations();
      }

      const allConversations = [...data, ...demoConversations];
      
      // Remove duplicates based on user_id
      const uniqueConversations = Array.from(new Map(allConversations.map(item => [item.user_id, item])).values());
      
      const sorted = uniqueConversations.sort((a, b) => {
        const dateA = a.last_message?.created_at || a.updated_at || 0;
        const dateB = b.last_message?.created_at || b.updated_at || 0;
        return new Date(dateB) - new Date(dateA);
      });
      
      setConversations(sorted);
      setFilteredConversations(sorted);
      
      // Auto-select first conversation if none selected
      if (sorted.length > 0 && !selectedUser) {
        setSelectedUser(sorted[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // Don't show toast for this, as it might be expected in demo mode
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
