import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  venue_name: string | null;
  city_id: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  rsvp_count: number;
  max_attendees: number | null;
  status: string;
  organizer_name: string;
  my_rsvp?: string | null;
}

export function useEvents(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['events', params ?? {}],
    queryFn: async () => {
      const { data } = await api.getEvents(params);
      return (data ?? []) as ApiEvent[];
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useRSVP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.rsvpEvent(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useCancelRSVP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.cancelRsvp(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
