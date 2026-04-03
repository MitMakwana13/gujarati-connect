import { supabase, NearbyUser } from '@/lib/supabase';

export const LocationService = {
  getCurrentLocation(): Promise<{ lat: number; lng: number; accuracy: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },

  async saveLocation(lat: number, lng: number, accuracy?: number, city?: string, country?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('user_locations').upsert({
      user_id: user.id,
      location: `POINT(${lng} ${lat})`,
      ...(accuracy ? { accuracy_meters: Math.round(accuracy) } : {}),
      ...(city ? { city } : {}),
      ...(country ? { country } : {}),
    });
  },

  async reverseGeocode(lat: number, lng: number): Promise<{ city: string; country: string }> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const geo = await res.json();
      return {
        city: geo.address?.city || geo.address?.town || geo.address?.village || '',
        country: geo.address?.country || '',
      };
    } catch {
      return { city: '', country: '' };
    }
  },

  async getNearbyUsers(lat: number, lng: number, radiusKm = 5): Promise<NearbyUser[]> {
    const radiusM = radiusKm >= 20000 ? 40000000 : radiusKm * 1000;
    const { data, error } = await supabase.rpc('get_nearby_users', { lat, lng, radius: radiusM });
    if (error) throw error;
    return (data ?? []) as NearbyUser[];
  },
};
