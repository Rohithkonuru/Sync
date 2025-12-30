import React, { useState, useRef } from 'react';
import { FiImage, FiX, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { postService } from '../services/api';
import { getErrorMessage } from '../utils/errorHelpers';

const PostComposer = ({ onSubmit, placeholder = "What's on your mind?", maxLength = 2000 }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length + images.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    imageFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { file, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      toast.error('Please add some content or images');
      return;
    }

    if (content.length > maxLength) {
      toast.error(`Content exceeds ${maxLength} characters`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload images first
      const uploadedImageUrls = [];
      for (const img of images) {
        if (img.file) {
          try {
            const response = await postService.uploadImage(img.file);
            uploadedImageUrls.push(response.url);
          } catch (error) {
            console.error('Failed to upload image:', error);
            toast.error('Failed to upload one or more images');
            setIsSubmitting(false);
            return;
          }
        } else {
          uploadedImageUrls.push(img.preview);
        }
      }

      await onSubmit({
        content: content.trim(),
        images: uploadedImageUrls,
      });
      setContent('');
      setImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Toast success is handled by parent or assumed success here if no error throw
    } catch (error) {
      // Error handled by parent usually, but we catch here to stop submitting state
      console.error('Post creation error:', error);
      toast.error(getErrorMessage(error) || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-soft p-4">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={4}
          maxLength={maxLength}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-neutral-900 placeholder-neutral-400"
        />
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Add images"
            >
              <FiImage className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <span className="text-xs text-neutral-500">
              {content.length}/{maxLength}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && images.length === 0)}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <FiSend className="w-4 h-4" />
            <span>Post</span>
          </button>
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-error-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default PostComposer;

