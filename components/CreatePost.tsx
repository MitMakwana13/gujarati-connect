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
    <div className="glass-card mb-6 overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold shrink-0">
            {profile?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <textarea
              placeholder="What's on your mind?"
              className="w-full bg-transparent border-none outline-none text-white placeholder-white/40 resize-none py-2 min-h-[40px] max-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanding(true)}
              rows={isExpanding ? 3 : 1}
            />
          </div>
        </div>

        <AnimatePresence>
          {isExpanding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-between mt-4 border-t border-white/10 pt-4"
            >
              <div className="flex gap-2">
                <button 
                  className="p-2 rounded-full hover:bg-white/10 text-white/60 transition-colors"
                  title="Add Image"
                >
                  <ImageIcon size={20} />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsExpanding(false)}
                  className="px-4 py-2 rounded-xl text-white/60 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !content.trim()}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-orange-900/20"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Send size={16} />
                  )}
                  Post
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
