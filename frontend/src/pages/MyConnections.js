import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { FiUser, FiMessageSquare, FiX, FiUserCheck, FiUserX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import IncomingRequestsPanel from '../components/IncomingRequestsPanel';
import MyConnectionsList from '../components/MyConnectionsList';
import { getErrorMessage } from '../utils/errorHelpers';

const MyConnections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connections'); // 'connections' or 'requests'
  const [undoActions, setUndoActions] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [connectionsData, requestsData] = await Promise.all([
        userService.getConnections().catch(() => []),
        userService.getConnectionRequests().catch(() => [])
      ]);
      setConnections(connectionsData || []);
      setConnectionRequests(requestsData || []);
    } catch (error) {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId) => {
    // Optimistic update
    const request = connectionRequests.find((r) => r.id === userId);
    setConnectionRequests((prev) => prev.filter((r) => r.id !== userId));
    setConnections((prev) => [...prev, request]);

    // Store undo action
    const undoAction = () => {
      setConnectionRequests((prev) => [...prev, request]);
      setConnections((prev) => prev.filter((c) => c.id !== userId));
      delete undoActions[`accept_${userId}`];
    };
    setUndoActions((prev) => ({ ...prev, [`accept_${userId}`]: undoAction }));

    toast.success(
      (t) => (
        <div className="flex items-center space-x-2">
          <span>Connection accepted</span>
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
      await userService.acceptConnection(userId);
      // Clear undo after 5 seconds
      setTimeout(() => {
        delete undoActions[`accept_${userId}`];
        setUndoActions((prev) => {
          const newActions = { ...prev };
          delete newActions[`accept_${userId}`];
          return newActions;
        });
      }, 5000);
    } catch (error) {
      // Revert on error
      undoAction();
      toast.error(getErrorMessage(error) || 'Failed to accept connection');
    }
  };

  const handleReject = async (userId) => {
    // Optimistic update
    const request = connectionRequests.find((r) => r.id === userId);
    setConnectionRequests((prev) => prev.filter((r) => r.id !== userId));

    // Store undo action
    const undoAction = () => {
      setConnectionRequests((prev) => [...prev, request]);
      delete undoActions[`reject_${userId}`];
    };
    setUndoActions((prev) => ({ ...prev, [`reject_${userId}`]: undoAction }));

    toast.success(
      (t) => (
        <div className="flex items-center space-x-2">
          <span>Connection request rejected</span>
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
      await userService.rejectConnection(userId);
      setTimeout(() => {
        delete undoActions[`reject_${userId}`];
        setUndoActions((prev) => {
          const newActions = { ...prev };
          delete newActions[`reject_${userId}`];
          return newActions;
        });
      }, 5000);
    } catch (error) {
      // Revert on error
      undoAction();
      toast.error(getErrorMessage(error) || 'Failed to reject connection');
    }
  };

  const handleRemove = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from your connections?`)) {
      return;
    }

    // Optimistic update
    const connection = connections.find((c) => c.id === userId);
    setConnections((prev) => prev.filter((c) => c.id !== userId));

    // Store undo action
    const undoAction = () => {
      setConnections((prev) => [...prev, connection]);
      delete undoActions[`remove_${userId}`];
    };
    setUndoActions((prev) => ({ ...prev, [`remove_${userId}`]: undoAction }));

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
      await userService.removeConnection(userId);
      setTimeout(() => {
        delete undoActions[`remove_${userId}`];
        setUndoActions((prev) => {
          const newActions = { ...prev };
          delete newActions[`remove_${userId}`];
          return newActions;
        });
      }, 5000);
    } catch (error) {
      // Revert on error
      undoAction();
      toast.error(getErrorMessage(error) || 'Failed to remove connection');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Connections</h1>
        <p className="text-gray-600 mt-2">Manage your professional network</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connections'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Requests ({connectionRequests.length})
          </button>
        </nav>
      </div>

      {/* Connections List */}
      {activeTab === 'connections' && (
        <MyConnectionsList
          connections={connections}
          onRemove={handleRemove}
          onUpdate={setConnections}
          loading={loading}
        />
      )}

      {/* Connection Requests */}
      {activeTab === 'requests' && (
        <IncomingRequestsPanel
          requests={connectionRequests}
          onUpdate={setConnectionRequests}
        />
      )}
    </div>
  );
};

export default MyConnections;

