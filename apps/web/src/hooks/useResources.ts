import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiResource {
  id: string;
  title: string;
  category: string;
  description: string;
  contact_method: string;
  contact_detail?: string | null;
  price: string | null;
  currency: string;
  is_active: boolean;
  created_at: string;
  author_display_name?: string;
  city_name?: string;
}

export function useResources(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['resources', params ?? {}],
    queryFn: async () => {
      const { data } = await api.getResources(params);
      return (data ?? []) as ApiResource[];
    },
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createResource,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}
