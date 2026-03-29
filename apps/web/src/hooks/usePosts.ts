import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await api.getPosts();
      return (data || []).map((p: any) => ({
        id: p.id,
        author: {
          name: p.author_display_name,
          avatar: p.author_avatar_url || '🧑',
          city: 'Global', // Would come from profile join
          initials: p.author_display_name?.split(' ').map((n: string) => n[0]).join('').substring(0,2) || 'U'
        },
        body: p.body,
        time: new Date(p.created_at).toLocaleDateString(),
        likes: p.like_count,
        comments: p.comment_count,
        tags: [], // Could parse from body 
        liked: p.my_reaction === 'like',
        group: p.group_id ? 'A Group' : undefined,
      }));
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isCurrentlyLiked }: { id: string; isCurrentlyLiked: boolean }) => {
      return isCurrentlyLiked ? api.unlikePost(id) : api.likePost(id);
    },
    onMutate: async ({ id, isCurrentlyLiked }) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts']);

      queryClient.setQueryData(['posts'], (old: any) => {
        if (!old) return old;
        return old.map((post: any) => {
          if (post.id === id) {
            return {
              ...post,
              my_reaction: isCurrentlyLiked ? null : 'like',
              like_count: isCurrentlyLiked ? Math.max(0, post.like_count - 1) : post.like_count + 1,
            };
          }
          return post;
        });
      });

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
