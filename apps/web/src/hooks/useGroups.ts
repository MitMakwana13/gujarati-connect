import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: string;
  join_policy: string;
  member_count: number;
  tags: string[];
  creator_name: string;
  myMembership?: { role: string; status: string; joined_at: string } | null;
}

export function useGroups(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['groups', params ?? {}],
    queryFn: async () => {
      const { data } = await api.getGroups(params);
      return (data ?? []) as ApiGroup[];
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createGroup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.joinGroup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.leaveGroup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
