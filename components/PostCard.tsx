'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Post, Comment } from '@/lib/supabase';
import { InteractionService } from '@/lib/services/interaction.service';
import { PostService } from '@/lib/services/post.service';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';

interface PostCardProps {
  post: Post;
  onDelete: (postId: string) => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    
    // Optimistic UI
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    
    try {
      await InteractionService.toggleLike(post.id);
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const toggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const data = await InteractionService.getComments(post.id);
        setComments(data);
      } catch (error) {
        toast.error('Failed to load comments');
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      const comment = await InteractionService.addComment(post.id, newComment);
      toast.success('Comment added');
      setNewComment('');
      setCommentsCount(prev => prev + 1);
      
      const data = await InteractionService.getComments(post.id);
      setComments(data);
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] p-4 mb-3 transition-all hover:border-[var(--border2)] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[rgba(232,137,42,0.03)] to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-3.5">
        <div 
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[15px] font-bold shrink-0 shadow-md relative overflow-hidden border border-white/10"
          style={{ background: 'linear-gradient(135deg, var(--saffron), var(--saffron-dark))' }}
        >
          {(post as any).user_photo_url ? (
            <img src={(post as any).user_photo_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="relative z-10 text-white">{(post as any).user_name?.[0] || 'G'}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-[var(--text)] leading-tight truncate">{(post as any).user_name || 'Anonymous User'}</div>
          <div className="text-[11px] text-[var(--text3)] flex items-center gap-1.5 mt-0.5">
            <span className="flex items-center gap-1">📍 {(post as any).location || 'Global'}</span>
            {(post as any).metadata?.community && (
              <>
                <span className="opacity-40">·</span>
                <span className="text-[var(--saffron)] font-semibold uppercase tracking-wider text-[9px]">{(post as any).metadata.community}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="text-[10px] font-medium text-[var(--text4)] bg-[var(--surface2)] px-2 py-1 rounded-full border border-[var(--border)] uppercase tracking-tight">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: false }).replace('about ', '')}
        </div>
      </div>

      {/* Body */}
      <div className="text-[13px] text-[var(--text)] leading-[1.6] mb-3.5 whitespace-pre-wrap">
        {post.content}
      </div>
      
      {post.image_url && (
        <div className="rounded-[12px] overflow-hidden mb-4 border border-[var(--border)] aspect-video bg-[var(--surface2)]">
          <img src={post.image_url} alt="Post image" className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
        </div>
      )}

      {/* Actions */}
      <div className="flex border-t border-[var(--border)] pt-1.5 -mx-1">
        <button 
          onClick={handleLike}
          className={`post-action ${isLiked ? 'liked' : ''}`}
        >
          <span className="text-[15px]">❤️</span>
          <span className="font-bold text-[11px] uppercase tracking-[0.05em]">{likesCount}</span>
        </button>
        
        <button 
          onClick={toggleComments}
          className="post-action"
        >
          <span className="text-[15px]">💬</span>
          <span className="font-bold text-[11px] uppercase tracking-[0.05em]">{commentsCount}</span>
        </button>

        <button 
          className="post-action"
        >
          <span className="text-[15px]">🔁</span>
          <span className="font-bold text-[11px] uppercase tracking-[0.05em]">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-[var(--border)] overflow-hidden"
          >
            <div className="space-y-3.5 mb-4 max-h-[250px] overflow-y-auto custom-scrollbar">
              {isLoadingComments ? (
                <div className="text-center py-4 text-xs text-[var(--text4)] uppercase tracking-widest animate-pulse">Loading Comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4 text-xs text-[var(--text4)]">No comments yet.</div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--surface3)] to-[var(--surface4)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[10px] font-bold text-[var(--text2)]">
                      {comment.user?.name?.[0] || 'G'}
                    </div>
                    <div className="flex-1 bg-[var(--surface2)] rounded-[14px] p-3 border border-[var(--border)]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[var(--text)] text-[11px]">{comment.user?.name || 'User'}</span>
                      </div>
                      <p className="text-[var(--text2)] text-[12px] leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex gap-2 bg-[var(--surface2)] p-1.5 rounded-[14px] border border-[var(--border)] focus-within:border-[rgba(232,137,42,0.3)] transition-all">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--text)] placeholder:text-[var(--text4)] px-2.5 h-8"
              />
              <button
                onClick={submitComment}
                disabled={!newComment.trim() || isSubmittingComment}
                className="bg-[var(--saffron)] hover:bg-[var(--saffron-dark)] disabled:opacity-50 text-white h-8 px-4 rounded-[10px] text-[11px] font-bold transition-all shadow-md active:scale-95"
              >
                {isSubmittingComment ? '...' : 'SEND'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
