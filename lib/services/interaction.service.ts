import { supabase, Comment } from '@/lib/supabase';

export const InteractionService = {
  async toggleLike(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      return false;
    } else {
      // Like
      await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.id
        });
      return true;
    }
  },

  async addComment(postId: string, content: string): Promise<Comment | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data as Comment;
  },

  async getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:profiles(name, photo_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Comment[];
  },

  async deleteComment(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    return supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);
  }
};
