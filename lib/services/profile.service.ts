import { supabase, Profile } from '@/lib/supabase';

export const ProfileService = {
  async getMyProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    return data as Profile | null;
  },

  async getProfileById(id: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    return data as Profile | null;
  },

  async updateProfile(payload: Partial<Pick<Profile,
    'name' | 'bio' | 'profession' | 'native_city' | 'current_city' |
    'current_country' | 'photo_url' | 'privacy_mode' | 'is_online' | 'last_seen_at'
  >>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('profiles').update(payload).eq('id', user.id);
  },

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },

  async setOnline(userId: string, online: boolean) {
    return supabase.from('profiles').update({
      is_online: online,
      last_seen_at: new Date().toISOString(),
    }).eq('id', userId);
  },

  async blockUser(blockedId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('user_blocks').insert({ blocker_id: user.id, blocked_id: blockedId });
  },

  async reportUser(reportedId: string, reason: string, details?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('reports').insert({ reporter_id: user.id, reported_user_id: reportedId, reason, details: details || null });
  },
};
