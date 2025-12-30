import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiUserCheck, FiUserX, FiUser, FiClock } from 'react-icons/fi';
import { userService } from '../services/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHelpers';

/**
 * Incoming Requests Panel Component
 * Displays incoming connection requests with Accept/Decline actions
 * Includes optimistic UI updates and 5-second undo functionality
 * 
 * Usage:
 * <IncomingRequestsPanel requests={requests} onUpdate={handleUpdate} />
 */
const IncomingRequestsPanel = ({ requests = [], onUpdate }) => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(new Set());
  const [undoActions, setUndoActions] = useState({});

  const handleAccept = async (userId, request) => {
    if (processing.has(userId)) return;

    // Optimistic update
    const updatedRequests = requests.filter(r => r.id !== userId);
    onUpdate(updatedRequests);

    // Store undo action
    const undoAction = () => {
      onUpdate([...updatedRequests, request]);
      delete undoActions[`accept_${userId}`];
      setUndoActions(prev => {
        const newActions = { ...prev };
        delete newActions[`accept_${userId}`];
        return newActions;
      });
    };
    setUndoActions(prev => ({ ...prev, [`accept_${userId}`]: undoAction }));

    setProcessing(prev => new Set(prev).add(userId));

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
      await userService.acceptConnectionNew(userId);
      // Clear undo after 5 seconds
      setTimeout(() => {
        delete undoActions[`accept_${userId}`];
        setUndoActions(prev => {
          const newActions = { ...prev };
          delete newActions[`accept_${userId}`];
          return newActions;
        });
      }, 5000);
    } catch (error) {
      // Revert on error
      undoAction();
      toast.error(getErrorMessage(error) || 'Failed to accept connection');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDecline = async (userId, request) => {
    if (processing.has(userId)) return;

    // Optimistic update
    const updatedRequests = requests.filter(r => r.id !== userId);
    onUpdate(updatedRequests);

    // Store undo action
    const undoAction = () => {
      onUpdate([...updatedRequests, request]);
      delete undoActions[`decline_${userId}`];
      setUndoActions(prev => {
        const newActions = { ...prev };
        delete newActions[`decline_${userId}`];
        return newActions;
      });
    };
    setUndoActions(prev => ({ ...prev, [`decline_${userId}`]: undoAction }));

    setProcessing(prev => new Set(prev).add(userId));

    toast.success(
      (t) => (
        <div className="flex items-center space-x-2">
          <span>Connection request declined</span>
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
      await userService.declineConnectionNew(userId);
      // Clear undo after 5 seconds
      setTimeout(() => {
        delete undoActions[`decline_${userId}`];
        setUndoActions(prev => {
          const newActions = { ...prev };
          delete newActions[`decline_${userId}`];
          return newActions;
        });
      }, 5000);
    } catch (error) {
      // Revert on error
      undoAction();
      toast.error(getErrorMessage(error) || 'Failed to decline connection');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <FiUser className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
        <p className="text-neutral-500 text-lg">No pending requests</p>
        <p className="text-neutral-400 text-sm mt-2">Connection requests will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {requests.map((request) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl border border-neutral-200 shadow-soft hover:shadow-medium transition-all p-4"
          >
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center space-x-4 flex-1 cursor-pointer"
                onClick={() => navigate(`/profile/${request.id}`)}
              >
                {request.profile_picture ? (
                  <img
                    src={request.profile_picture}
                    alt={request.first_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-primary-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 truncate">
                    {request.first_name} {request.last_name}
                  </h3>
                  {request.headline && (
                    <p className="text-sm text-neutral-600 truncate">{request.headline}</p>
                  )}
                  {request.location && (
                    <p className="text-xs text-neutral-500 mt-1">{request.location}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <motion.button
                  onClick={() => handleAccept(request.id, request)}
                  disabled={processing.has(request.id)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label="Accept connection request"
                >
                  {processing.has(request.id) ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <FiUserCheck className="w-5 h-5" />
                  )}
                  <span>Accept</span>
                </motion.button>

                <motion.button
                  onClick={() => handleDecline(request.id, request)}
                  disabled={processing.has(request.id)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors font-medium flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label="Decline connection request"
                >
                  <FiUserX className="w-5 h-5" />
                  <span>Decline</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default IncomingRequestsPanel;

