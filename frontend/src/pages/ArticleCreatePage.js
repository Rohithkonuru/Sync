import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../services/api';
import toast from 'react-hot-toast';

const ArticleCreatePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Please add both title and content');
      return;
    }

    try {
      setSubmitting(true);
      await postService.createPost({
        content: `${title.trim()}\n\n${content.trim()}`,
        images: [],
      });
      toast.success('Article published successfully!');
      navigate('/home');
    } catch (error) {
      toast.error('Failed to publish article');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Write Article</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article content..."
            rows={14}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Publishing...' : 'Publish Article'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ArticleCreatePage;
