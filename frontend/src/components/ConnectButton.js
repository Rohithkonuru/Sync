import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUserPlus, FiCheck, FiClock, FiUserCheck, FiX } from 'react-icons/fi';
import { userService } from '../services/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHelpers';

/**
 * Animated Connect Button Component
 * States: connect | requested | request_received | connected
 * 
 * Usage:
 * <ConnectButton userId={user.id} onStatusChange={(status) => {}} />
 */
const ConnectButton = ({ 
  userId, 
  initialStatus = 'not_connected',
  onStatusChange,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    loadConnectionStatus();
  }, [userId]);

  const loadConnectionStatus = async () => {
    try {
      const data = await userService.getConnectionStatus(userId);
      setStatus(data.status);
      if (onStatusChange) {
        onStatusChange(data.status);
      }
    } catch (error) {
      console.error('Error loading connection status:', error);
    }
  };

  const handleConnect = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await userService.sendConnectionRequestNew(userId);
      setStatus('request_sent');
      if (onStatusChange) {
        onStatusChange('request_sent');
      }
      toast.success('Connection request sent');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await userService.acceptConnectionNew(userId);
      setStatus('connected');
      if (onStatusChange) {
        onStatusChange('connected');
      }
      toast.success('Connection accepted');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to accept connection');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await userService.declineConnectionNew(userId);
      setStatus('not_connected');
      if (onStatusChange) {
        onStatusChange('not_connected');
      }
      toast.success('Connection request declined');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to decline connection');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await userService.cancelConnectionRequest(userId);
      setStatus('not_connected');
      if (onStatusChange) {
        onStatusChange('not_connected');
      }
      toast.success('Request cancelled');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to cancel request');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getButtonContent = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <FiUserCheck className={iconSizes[size]} />,
          label: 'Connected',
          className: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
        };
      case 'request_sent':
        return {
          icon: <FiClock className={iconSizes[size]} />,
          label: isHovered ? 'Cancel Request' : 'Requested',
          className: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200'
        };
      case 'request_received':
        return {
          icon: <FiUserPlus className={iconSizes[size]} />,
          label: 'Accept',
          className: 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
        };
      default:
        return {
          icon: <FiUserPlus className={iconSizes[size]} />,
          label: 'Connect',
          className: 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
        };
    }
  };

  const handleClick = () => {
    switch (status) {
      case 'not_connected':
        handleConnect();
        break;
      case 'request_sent':
        handleCancel();
        break;
      case 'request_received':
        handleAccept();
        break;
      default:
        break;
    }
  };

  const buttonContent = getButtonContent();

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={loading || status === 'connected' || status === 'self'}
        className={`
          ${sizeClasses[size]}
          ${buttonContent.className}
          border-2 rounded-lg font-medium
          flex items-center space-x-2
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        `}
        whileHover={!loading && status !== 'connected' && status !== 'self' ? { scale: 1.02 } : {}}
        whileTap={!loading && status !== 'connected' && status !== 'self' ? { scale: 0.98 } : {}}
        aria-label={buttonContent.label}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className={`${iconSizes[size]} border-2 border-current border-t-transparent rounded-full`}
              />
            ) : (
              buttonContent.icon
            )}
            {showLabel && (
              <span>{loading ? 'Processing...' : buttonContent.label}</span>
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Decline button for incoming requests */}
      {status === 'request_received' && (
        <motion.button
          onClick={handleDecline}
          disabled={loading}
          className={`
            absolute -right-2 top-0
            ${sizeClasses[size]}
            bg-red-100 text-red-700 border-2 border-red-300 rounded-lg
            hover:bg-red-200
            flex items-center space-x-1
            transition-all duration-200
            disabled:opacity-50
            focus:outline-none focus:ring-2 focus:ring-red-500
          `}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Decline connection request"
        >
          <FiX className={iconSizes[size]} />
          {showLabel && <span>Decline</span>}
        </motion.button>
      )}
    </div>
  );
};

export default ConnectButton;

