import { supabase, Event } from '@/lib/supabase';

export const EventService = {
  async getEvents(city?: string): Promise<Event[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase.from('event_feed').select('*').order('event_date', { ascending: true });

    if (city) query = query.ilike('city', `%${city}%`);

    const { data, error } = await query;
    if (error) throw error;

    if (user && data) {
      const ids = data.map((e) => e.id);
      const { data: rsvps } = await supabase
        .from('rsvps')
        .select('event_id')
        .eq('user_id', user.id)
        .in('event_id', ids);

      const rsvpedIds = new Set(rsvps?.map((r) => r.event_id));
      return data.map((e) => ({ ...e, is_rsvped: rsvpedIds.has(e.id) })) as Event[];
    }

    return (data ?? []) as Event[];
  },

  async createEvent(payload: {
    title: string;
    description?: string;
    location?: string;
    city?: string;
    event_date: string;
    image_url?: string;
    is_free?: boolean;
    max_attendees?: number;
  }): Promise<Event> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('events')
      .insert({ ...payload, creator_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data as Event;
  },

  async toggleRsvp(eventId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('rsvps')
      .select('event_id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      await supabase.from('rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
      return false; // un-RSVPed
    } else {
      await supabase.from('rsvps').insert({ event_id: eventId, user_id: user.id });
      return true; // RSVPed
    }
  },

  async deleteEvent(eventId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('events').delete().eq('id', eventId).eq('creator_id', user.id);
  },

  async uploadEventImage(file: File): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = file.name.split('.').pop();
    const path = `event-images/${user.id}/${Math.random()}.${ext}`;
    const { error } = await supabase.storage.from('posts').upload(path, file);
    if (error) return null;

    return supabase.storage.from('posts').getPublicUrl(path).data.publicUrl;
  },
};
