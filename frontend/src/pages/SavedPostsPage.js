import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/api';
import FeedCard from '../components/common/FeedCard';
import { FiBookmark } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SavedPostsPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedPosts = async () => {
      if (!user?._id && !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = user?._id || user?.id;
        const data = await postService.getSavedPostsByUser(userId, { limit: 30 });
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error('Failed to load saved posts');
      } finally {
        setLoading(false);
      }
    };

    loadSavedPosts();
  }, [user?._id, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <FiBookmark className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Saved Posts</h1>
        </div>

        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <FeedCard
                key={post.id || post._id}
                post={post}
                currentUserId={user?._id || user?.id}
                onPostUpdate={(postUpdate) => {
                  if (typeof postUpdate === 'string') {
                    setPosts((prev) => prev.filter((p) => String(p.id || p._id) !== String(postUpdate)));
                  }
                }}
              />
            ))
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-500">
              No saved posts found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedPostsPage;
