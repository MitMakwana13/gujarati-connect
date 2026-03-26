'use client';

import { useState, useEffect, useCallback } from 'react';
import { PostService } from '@/lib/services/post.service';
import { Post, supabase } from '@/lib/supabase';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const loadPosts = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const currentOffset = isInitial ? 0 : offset;
      const data = await PostService.getFeed(LIMIT, currentOffset);
      
      if (data.length < LIMIT) {
        setHasMore(false);
      }
      
      if (isInitial) {
        setPosts(data);
        setOffset(LIMIT);
      } else {
        setPosts(prev => [...prev, ...data]);
        setOffset(prev => prev + LIMIT);
      }
    } catch (error) {
      toast.error('Failed to load feed');
      console.error(error);
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  }, [offset]);

  useEffect(() => {
    loadPosts(true);

    // Setup Realtime Subscription
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          // A new post was created, we should fetch it or reload the feed 
          // to get the correct view format (with user_name etc)
          // For simplicity and immediate effect, just reload the first page
          setOffset(0);
          loadPosts(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };
  
  const handlePostCreated = () => {
    // Immediate reload of the first page to show the new post
    setOffset(0);
    loadPosts(true);
  };

  return (
    <div className="max-w-xl mx-auto pb-20">
      <CreatePost onPostCreated={handlePostCreated} />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 min-h-[160px] flex flex-col gap-4">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full skeleton" />
                <div className="space-y-2">
                  <div className="w-32 h-4 skeleton rounded" />
                  <div className="w-20 h-3 skeleton rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-4 skeleton rounded" />
                <div className="w-5/6 h-4 skeleton rounded" />
                <div className="w-4/6 h-4 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <AnimatePresence>
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={handleDelete} 
              />
            ))}
          </AnimatePresence>
          
          {posts.length === 0 && (
            <div className="text-center py-10 text-white/50">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          )}

          {hasMore && posts.length > 0 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => loadPosts()}
                disabled={loadingMore}
                className="btn btn-secondary px-6 rounded-full text-sm font-medium disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
