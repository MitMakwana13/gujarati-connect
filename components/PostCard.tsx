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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card mb-4 overflow-hidden"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-3 items-center">
            {/* User Avatar */}
            {/* Note: post_feed view maps name/photo_url directly to the post object */}
            {/* We cast it here since the interface expects user.name but the view flattens it */}
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold overflow-hidden">
              {(post as any).user_photo_url ? (
                <img src={(post as any).user_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (post as any).user_name?.[0] || '?'
              )}
            </div>
            
            <div>
              <div className="font-semibold text-white">{(post as any).user_name || 'Anonymous User'}</div>
              <div className="text-xs text-white/50">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          
          {user?.id === post.user_id && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-1 bg-[#1A1A2E] border border-white/10 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden z-10"
                  >
                    <button 
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full text-left px-4 py-3 text-red-400 hover:bg-white/5 transition-colors text-sm"
                    >
                      <Trash size={16} /> Delete Post
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-white/90 whitespace-pre-wrap text-sm md:text-base mb-4 leading-relaxed">
          {post.content}
        </div>
        
        {post.image_url && (
          <div className="rounded-2xl overflow-hidden mb-4 border border-white/10">
            <img src={post.image_url} alt="Post image" className="w-full object-cover max-h-[400px]" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-3 border-t border-white/10">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm transition-colors ${isLiked ? 'text-orange-500' : 'text-white/60 hover:text-white/90'}`}
          >
            <motion.div whileTap={{ scale: 0.8 }}>
              <Heart size={20} className={isLiked ? 'fill-orange-500' : ''} />
            </motion.div>
            <span className="font-medium">{likesCount}</span>
          </button>
          
          <button 
            onClick={toggleComments}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="font-medium">{commentsCount}</span>
          </button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
            >
              {isLoadingComments ? (
                <div className="flex justify-center p-4">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-orange-500 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white text-xs font-bold overflow-hidden">
                        {comment.user?.photo_url ? (
                          <img src={comment.user.photo_url} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          comment.user?.name?.[0] || '?'
                        )}
                      </div>
                      <div className="flex-1 bg-white/5 rounded-2xl p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-white text-sm">{comment.user?.name || 'User'}</span>
                          <span className="text-[10px] text-white/40">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {comments.length === 0 && (
                    <div className="text-center text-white/40 text-sm py-2">
                      No comments yet. Be the first to reply!
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm text-white placeholder-white/40 resize-none min-h-[40px] max-h-[100px] focus:outline-none focus:border-orange-500/50"
                    rows={1}
                  />
                </div>
                <button
                  onClick={submitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors mb-[2px]"
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Just explicitly rendering Send here so I don't have to rewrite imports
function Send(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
}
