import React, { useState, useRef } from 'react';
import { FiImage, FiX, FiSend, FiVideo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { postService } from '../services/api';
import { getErrorMessage } from '../utils/errorHelpers';

const PostComposer = ({ onSubmit, placeholder = "What's on your mind?", maxLength = 2000, mode = 'text' }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState('');
  const [eventDetails, setEventDetails] = useState({ title: '', date: '', time: '', location: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

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

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);
    const videoFiles = files.filter(file => file.type.startsWith('video/') || file.type === 'video/mp4');
    
    if (videoFiles.length > 1) {
      toast.error('Maximum 1 video allowed');
      return;
    }

    videoFiles.forEach(file => {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video file is too large. Maximum size is 100MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setVideos([{ file, preview: reader.result, name: file.name }]);
        toast.success('Video added');
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideos([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation based on mode
    if (mode === 'article') {
      if (!title.trim() || !content.trim()) {
        toast.error('Please add a title and content for the article');
        return;
      }
    } else if (mode === 'event') {
      if (!eventDetails.title.trim() || !eventDetails.date || !content.trim()) {
        toast.error('Please add event title, date, and description');
        return;
      }
    } else {
      if (!content.trim() && images.length === 0 && videos.length === 0) {
        toast.error('Please add some content, images, or videos');
        return;
      }
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

      let uploadedVideoUrl = null;
      if (videos.length > 0 && videos[0]?.file) {
        try {
          const videoResponse = await postService.uploadImage(videos[0].file);
          uploadedVideoUrl = videoResponse.url;
        } catch (error) {
          console.error('Failed to upload video:', error);
          toast.error('Failed to upload video');
          setIsSubmitting(false);
          return;
        }
      }

      // Build post data based on mode
      const postData = {
        content: content.trim(),
        images: uploadedImageUrls,
        type: mode
      };

      if (mode === 'article') {
        postData.title = title.trim();
      } else if (mode === 'event') {
        postData.eventDetails = eventDetails;
        postData.title = eventDetails.title;
      } else if (mode === 'video') {
        postData.hasVideo = videos.length > 0;
        postData.videoName = videos[0]?.name;
        postData.media_url = uploadedVideoUrl;
        postData.media_type = 'video';
      }

      await onSubmit(postData);
      setContent('');
      setTitle('');
      setImages([]);
      setVideos([]);
      setEventDetails({ title: '', date: '', time: '', location: '' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Post creation error:', error);
      toast.error(getErrorMessage(error) || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-soft p-4">
      <form onSubmit={handleSubmit}>
        {/* Article Mode - Title Input */}
        {mode === 'article' && (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title..."
            maxLength={150}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 placeholder-neutral-400 mb-3 font-semibold text-lg"
          />
        )}

        {/* Event Mode - Event Details */}
        {mode === 'event' && (
          <div className="space-y-3 mb-3">
            <input
              type="text"
              value={eventDetails.title}
              onChange={(e) => setEventDetails({ ...eventDetails, title: e.target.value })}
              placeholder="Event title..."
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 placeholder-neutral-400 font-semibold"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={eventDetails.date}
                onChange={(e) => setEventDetails({ ...eventDetails, date: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="time"
                value={eventDetails.time}
                onChange={(e) => setEventDetails({ ...eventDetails, time: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <input
              type="text"
              value={eventDetails.location}
              onChange={(e) => setEventDetails({ ...eventDetails, location: e.target.value })}
              placeholder="Event location..."
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 placeholder-neutral-400"
            />
          </div>
        )}

        {/* Content Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={mode === 'article' ? 'Write your article...' : mode === 'event' ? 'Event description...' : mode === 'video' ? 'Describe your video...' : placeholder}
          rows={mode === 'article' ? 8 : 4}
          maxLength={maxLength}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-neutral-900 placeholder-neutral-400"
        />
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            {mode === 'text' || mode === 'article' || mode === 'event' ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Add images"
              >
                <FiImage className="w-5 h-5" />
              </button>
            ) : null}
            
            {mode === 'video' && (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Add video"
              >
                <FiVideo className="w-5 h-5" />
              </button>
            )}

            {mode !== 'video' && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            )}
            
            {mode === 'video' && (
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
            )}

            <span className="text-xs text-neutral-500">
              {content.length}/{maxLength}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && images.length === 0 && videos.length === 0)}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <FiSend className="w-4 h-4" />
            <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
          </button>
        </div>

        {/* Video Preview */}
        {videos.length > 0 && (
          <div className="mt-4">
            <div className="relative bg-neutral-100 rounded-lg overflow-hidden">
              <div className="p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">{videos[0].name}</span>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="p-1 bg-error-600 text-white rounded-full hover:bg-error-700"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Previews */}

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

