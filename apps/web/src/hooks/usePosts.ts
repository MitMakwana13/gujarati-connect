import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Normaliser ───────────────────────────────────────────────
// Maps raw API response to the shape the Feed UI expects.
function normalisePost(p: any) {
  const displayName = (p.author_display_name as string) ?? 'Unknown';

  return {
    id: p.id as string,
    author: {
      name: displayName,
      avatar: (p.author_avatar_url as string | null) ?? null,
      city: (p.author_city as string | null) ?? '',
      initials: displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
    },
    body: (p.body as string | null) ?? '',
    mediaUrls: ((p.media_urls as string[] | null) ?? []) as string[],
    time: new Date(p.created_at as string).toLocaleDateString(),
    createdAt: p.created_at as string,
    likes: (p.like_count as number) ?? 0,
    liked: p.my_reaction === 'like',
    comments: (p.comment_count as number) ?? 0,
    tags: [] as string[],
    group: (p.group_name as string | null) ?? undefined,
  };
}

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await api.getPosts();
      return (data ?? []).map(normalisePost);
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createPost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
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
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts']);

      queryClient.setQueryData(['posts'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((post: any) => {
          if (post.id !== id) return post;
          return {
            ...post,
            liked: !isCurrentlyLiked,
            likes: isCurrentlyLiked
              ? Math.max(0, (post.likes as number) - 1)
              : (post.likes as number) + 1,
          };
        });
      });

      return { previousPosts };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
