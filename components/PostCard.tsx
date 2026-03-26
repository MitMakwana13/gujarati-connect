'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, MoreHorizontal, Trash } from 'lucide-react';
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
      
      // We need to fetch the comment with user info again, or just manually construct it
      // for instant display. The realtime handler (if implemented) will catch other people's comments
      toast.success('Comment added');
      setNewComment('');
      setCommentsCount(prev => prev + 1);
      
      // Reload comments to get the populated user object
      const data = await InteractionService.getComments(post.id);
      setComments(data);
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await PostService.deletePost(post.id);
      onDelete(post.id);
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-[var(--surface2)] border border-[var(--border)] rounded-[var(--radius)] p-3.5 mb-2.5 transition-colors hover:border-[var(--border2)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 shadow-sm"
          style={{ 
            background: 'linear-gradient(135deg, var(--saffron), #c46c10)',
            color: '#fff' 
          }}
        >
          {(post as any).user_photo_url ? (
            <img src={(post as any).user_photo_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
          ) : (
            (post as any).user_name?.[0] || '?'
          )}
        </div>
        
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-[var(--text)]">{(post as any).user_name || 'Anonymous User'}</div>
          <div className="text-[11px] text-[var(--text2)] flex items-center gap-1">
            <span>🌍</span>
            <span>{(post as any).location || 'Global'}</span>
            {(post as any).metadata && (post as any).metadata.community && (
              <>
                <span>·</span>
                <span className="text-[var(--saffron)]">{(post as any).metadata.community}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="text-[11px] text-[var(--text3)]">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: false }).replace('about ', '')}
        </div>
      </div>

      {/* Body */}
      <div className="text-[13px] text-[var(--text)] leading-relaxed mb-2.5 whitespace-pre-wrap">
        {post.content}
      </div>
      
      {post.image_url && (
        <div className="rounded-[10px] overflow-hidden mb-2.5 border border-[var(--border)] h-[140px] bg-[var(--surface3)] flex items-center justify-center">
          <img src={post.image_url} alt="Post image" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex border-t border-[var(--border)] pt-2.5 mt-2.5">
        <button 
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs transition-colors py-1 rounded-lg hover:bg-[var(--saffron)]/5 ${isLiked ? 'text-[var(--saffron)]' : 'text-[var(--text2)]'}`}
        >
          <motion.span whileTap={{ scale: 1.2 }}>❤️</motion.span>
          <span className="font-medium text-[var(--text2)]">{likesCount}</span>
        </button>
        
        <button 
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-[var(--text2)] transition-colors py-1 rounded-lg hover:bg-[var(--saffron)]/5"
        >
          <span>💬</span>
          <span className="font-medium">{commentsCount}</span>
        </button>

        <button 
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-[var(--text2)] transition-colors py-1 rounded-lg hover:bg-[var(--saffron)]/5"
        >
          <span>🔁</span>
          <span className="font-medium">Share</span>
        </button>
      </div>

      {/* Comments Section (Simplified for mockup feel) */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2.5 pt-2.5 border-t border-[var(--border)] overflow-hidden"
          >
            {/* Standard comment logic preserved but simplified UI if needed */}
            {/* ... keeping your existing comment list logic here ... */}
            <div className="space-y-3 mb-3 max-h-[200px] overflow-y-auto pr-1">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--surface3)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {comment.user?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 bg-[var(--surface3)] rounded-xl p-2.5">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-semibold text-[var(--text)] text-xs">{comment.user?.name || 'User'}</span>
                    </div>
                    <p className="text-[var(--text2)] text-xs">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-[var(--surface3)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text3)] focus:outline-none focus:border-[var(--saffron)]"
              />
              <button
                onClick={submitComment}
                disabled={!newComment.trim() || isSubmittingComment}
                className="bg-[var(--saffron)] hover:bg-[var(--saffron-dark)] disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Just explicitly rendering Send here so I don't have to rewrite imports
function Send(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
}
