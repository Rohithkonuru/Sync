import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messageService, userService } from '../services/api';
import { FiSearch, FiMessageSquare, FiMoreVertical, FiUsers } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import MessageThread from '../components/MessageThread';
import ConversationSearch from '../components/ConversationSearch';
import { Link } from 'react-router-dom';

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
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.user_id);
      checkConnectionStatus(selectedUser.user_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  useEffect(() => {
    let result = conversations;
    if (filter === 'unread') result = result.filter(c => c.unread_count > 0);
    if (searchQuery.trim()) {
      result = result.filter(c =>
        c.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredConversations(result);
  }, [searchQuery, conversations, filter]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_message', (data) => {
      if (data.sender_id === selectedUser?.user_id || data.receiver_id === selectedUser?.user_id) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
      loadConversations();
    });
    socket.on('typing', (data) => {
      if (data.sender_id === selectedUser?.user_id) {
        setIsTyping(data.typing);
        setTypingUser(data.typing ? data.sender_id : null);
      }
    });
    socket.on('message_read', (data) => {
      setMessages(prev =>
        prev.map(msg => msg.id === data.message_id ? { ...msg, read_at: data.read_at } : msg)
      );
    });
    return () => {
      socket.off('new_message');
      socket.off('typing');
      socket.off('message_read');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, selectedUser, user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      const sorted = (data || []).sort((a, b) => {
        const dateA = a.last_message?.created_at || a.updated_at || 0;
        const dateB = b.last_message?.created_at || b.updated_at || 0;
        return new Date(dateB) - new Date(dateA);
      });
      setConversations(sorted);
      setFilteredConversations(sorted);
      if (sorted.length > 0 && !selectedUser) setSelectedUser(sorted[0]);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
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
      if (data.attachments?.length > 0) {
        for (const file of data.attachments) {
          await messageService.sendMessageWithAttachment(selectedUser.user_id, data.content || '', file);
        }
        if (!data.content) return;
      }
      const message = await messageService.sendMessage({
        receiver_id: selectedUser.user_id,
        content: data.content,
        message_type: 'text',
      });
      setMessages(prev => [...prev, message]);
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
      socket.emit('typing_start', { receiver_id: selectedUser.user_id, sender_id: user.id });
    }
  };

  const handleTypingStop = () => {
    if (socket && selectedUser && user) {
      socket.emit('typing_stop', { receiver_id: selectedUser.user_id, sender_id: user.id });
    }
  };

  const isConnected = selectedUser ? connectionStatuses[selectedUser.user_id]?.status === 'connected' : false;

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white">
      {/* Sidebar */}
      <div className="w-full md:w-96 border-r border-neutral-200 flex flex-col bg-white">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-neutral-900">Messages</h2>
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowSearchModal(true)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors" title="Search">
                <FiSearch className="w-5 h-5 text-neutral-600" />
              </button>
              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <FiMoreVertical className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            {['all', 'unread'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors capitalize flex items-center gap-1 ${filter === f ? 'bg-primary-100 text-primary-600 font-medium' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                {f}
                {f === 'unread' && conversations.filter(c => c.unread_count > 0).length > 0 && (
                  <span className="bg-primary-600 text-white text-xs rounded-full px-1.5 py-0.5">
                    {conversations.filter(c => c.unread_count > 0).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              {conversations.length === 0 ? (
                <>
                  <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                    <FiUsers className="w-8 h-8 text-primary-400" />
                  </div>
                  <p className="text-neutral-700 font-semibold mb-2">No conversations yet</p>
                  <p className="text-neutral-500 text-sm mb-4">Connect with people to start messaging.</p>
                  <Link to="/connections" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                    Find People to Connect
                  </Link>
                </>
              ) : (
                <>
                  <FiMessageSquare className="w-12 h-12 text-neutral-300 mb-3" />
                  <p className="text-neutral-600 font-medium">No results</p>
                  <p className="text-neutral-500 text-sm">Try a different search term</p>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {filteredConversations.map((conv) => {
                const isSelected = selectedUser?.user_id === conv.user_id;
                return (
                  <motion.div
                    key={conv.user_id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    onClick={() => setSelectedUser(conv)}
                    className={`p-4 border-b border-neutral-100 cursor-pointer transition-colors ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary-600' : 'hover:bg-neutral-50'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        {conv.user_picture ? (
                          <img src={conv.user_picture} alt={conv.user_name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-lg">{conv.user_name?.[0] || 'U'}</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-neutral-900 truncate">{conv.user_name}</h3>
                          {conv.last_message && (
                            <span className="text-xs text-neutral-500 ml-2 flex-shrink-0">
                              {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-neutral-600 truncate flex-1">{conv.last_message?.content || 'No messages yet'}</p>
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

      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedUser ? (
          <MessageThread
            messages={messages}
            currentUserId={user?.id}
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
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Your messages</h3>
              <p className="text-neutral-500 text-sm">Select a conversation on the left to read and reply.</p>
            </div>
          </div>
        )}
      </div>

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
