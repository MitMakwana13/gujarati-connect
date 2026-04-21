import { supabase, Business } from '@/lib/supabase';

export const BusinessService = {
  async getBusinesses(city?: string, category?: string): Promise<Business[]> {
    let query = supabase.from('businesses').select('*').order('created_at', { ascending: false });

    if (city) query = query.ilike('city', `%${city}%`);
    if (category) query = query.ilike('category', `%${category}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Business[];
  },

  async createBusiness(payload: {
    name: string;
    category?: string;
    description?: string;
    city?: string;
    country?: string;
    website?: string;
    phone?: string;
    image_url?: string;
  }): Promise<Business> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('businesses')
      .insert({ ...payload, owner_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data as Business;
  },

  async updateBusiness(id: string, payload: Partial<Business>): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('businesses')
      .update(payload)
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;
  },

  async deleteBusiness(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;
  },

  async uploadBusinessImage(file: File): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = file.name.split('.').pop();
    const path = `biz-images/${user.id}/${Math.random()}.${ext}`;
    const { error } = await supabase.storage.from('posts').upload(path, file);
    if (error) return null;

    return supabase.storage.from('posts').getPublicUrl(path).data.publicUrl;
  },
};
