import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MyProfile {
  id: string;
  email: string;
  email_verified: boolean;
  role: string;
  status: string;
  display_name: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  current_city: string | null;
  current_country: string | null;
  home_city_india: string | null;
  home_state_india: string | null;
  user_type: string | null;
  university: string | null;
  company: string | null;
  profession: string | null;
  interests: string[];
  languages: string[];
  is_discoverable: boolean;
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const { data } = await api.getMyProfile();
      return data as MyProfile;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
}
