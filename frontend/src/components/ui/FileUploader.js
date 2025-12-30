import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiX, FiFile, FiImage } from 'react-icons/fi';

/**
 * File Uploader Component
 * 
 * @param {function} onFileSelect - Callback with selected file
 * @param {array} accept - Accepted file types (e.g., ['image/*', '.pdf'])
 * @param {number} maxSize - Max file size in MB
 * @param {boolean} preview - Show file preview
 */
const FileUploader = ({
  onFileSelect,
  accept = [],
  maxSize = 10,
  preview = true,
  label = 'Upload file',
  helperText,
  error,
  className = '',
  ...props
}) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (selectedFile) => {
    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (preview && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }

    if (onFileSelect) {
      onFileSelect(selectedFile);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const getFileIcon = () => {
    if (file?.type.startsWith('image/')) {
      return <FiImage className="w-8 h-8" />;
    }
    return <FiFile className="w-8 h-8" />;
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-neutral-300 bg-neutral-50 hover:border-primary-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(',')}
          onChange={handleChange}
          className="hidden"
          aria-label={label}
        />

        {!file ? (
          <div className="text-center">
            <FiUpload className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <p className="text-sm font-medium text-neutral-700 mb-1">{label}</p>
            <p className="text-xs text-neutral-500 mb-4">
              {helperText || `Drag and drop or click to select (max ${maxSize}MB)`}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
            >
              Select File
            </motion.button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-neutral-200 rounded-lg flex items-center justify-center text-neutral-500">
                  {getFileIcon()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-2 hover:bg-neutral-200 rounded-lg transition-colors ml-4"
              aria-label="Remove file"
            >
              <FiX className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUploader;

