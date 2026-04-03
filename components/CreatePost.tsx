'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostService } from '@/lib/services/post.service';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';

interface CreatePostProps {
  onPostCreated: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await PostService.createPost(content);
      setContent('');
      setIsExpanding(false);
      onPostCreated();
      toast.success('Post shared successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-5 mb-4">
      <div 
        className="composer group"
        onClick={() => !isExpanding && setIsExpanding(true)}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="composer-avatar">
            {profile?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'GS'}
          </div>
          <div className="flex-1">
            <textarea
              placeholder="Share something with your community…"
              className="bg-transparent border-none outline-none text-[13px] text-[var(--text)] placeholder:text-[var(--text3)] resize-none w-full py-1 min-h-[40px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={isExpanding ? 3 : 1}
              autoFocus={isExpanding}
            />
          </div>
          {!isExpanding && (
            <div className="composer-actions">
              <div className="composer-action">📷</div>
              <div className="composer-action">📍</div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-between mt-3 border-t border-[var(--border)] pt-3 w-full overflow-hidden"
            >
              <div className="flex gap-2">
                <button className="composer-action !w-10 !h-10 text-xl">📷</button>
                <button className="composer-action !w-10 !h-10 text-xl">📍</button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsExpanding(false); }}
                  className="px-4 py-2 rounded-xl text-[var(--text3)] hover:text-[var(--text)] transition-colors text-xs font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
                  disabled={isSubmitting || !content.trim()}
                  className="bg-[var(--saffron)] hover:bg-[var(--saffron-dark)] disabled:opacity-50 text-white px-5 py-2 rounded-[10px] transition-all font-bold text-xs shadow-lg"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
