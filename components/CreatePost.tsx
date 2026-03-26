'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, X } from 'lucide-react';
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
        className="bg-[var(--surface2)] border border-[var(--border)] rounded-[var(--radius)] p-3.5 flex flex-col transition-colors hover:border-[var(--border2)] cursor-pointer"
        onClick={() => !isExpanding && setIsExpanding(true)}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--saffron-dark)] to-[var(--saffron)] flex items-center justify-center text-[13px] font-bold text-white shrink-0"
          >
            {profile?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'MS'}
          </div>
          <div className="flex-1">
            <textarea
              placeholder="Share something with your community…"
              className="w-full bg-transparent border-none outline-none text-[13px] text-[var(--text)] placeholder:text-[var(--text3)] resize-none py-1 min-h-[40px] max-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={isExpanding ? 3 : 1}
              autoFocus={isExpanding}
            />
          </div>
          {!isExpanding && (
            <div className="flex gap-2 ml-auto">
              <div className="w-[30px] h-[30px] bg-[var(--surface3)] rounded-lg flex items-center justify-center text-sm">📷</div>
              <div className="w-[30px] h-[30px] bg-[var(--surface3)] rounded-lg flex items-center justify-center text-sm">📍</div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-between mt-3 border-t border-[var(--border)] pt-3 overflow-hidden"
            >
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-[var(--surface3)] text-lg">📷</button>
                <button className="p-2 rounded-lg bg-[var(--surface3)] text-lg">📍</button>
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
                  className="bg-[var(--saffron)] hover:bg-[var(--saffron-dark)] disabled:opacity-50 text-white px-5 py-2 rounded-xl transition-all font-bold text-xs"
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
