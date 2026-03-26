import { supabase, Post } from '@/lib/supabase';

export const PostService = {
  async createPost(content: string, imageUrl?: string): Promise<Post | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Post;
  },

  async getFeed(limit = 20, offset = 0): Promise<Post[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch from the view
    const { data, error } = await supabase
      .from('post_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Check if liked by current user
    if (user && data) {
      const postIds = data.map(p => p.id);
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      const likedPostIds = new Set(likes?.map(l => l.post_id));
      return data.map(p => ({
        ...p,
        is_liked: likedPostIds.has(p.id)
      })) as Post[];
    }

    return data as Post[];
  },

  async deletePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    return supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);
  },

  async uploadPostImage(file: File): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `post-images/${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from('posts')
      .upload(filePath, file);

    if (error) return null;

    const { data } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
