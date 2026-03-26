import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Profile {
  id: string;
  username: string | null;
  name: string | null;
  photo_url: string | null;
  bio: string | null;
  profession: string | null;
  native_city: string | null;
  current_city: string | null;
  current_country: string | null;
  community_tag: string;
  privacy_mode: boolean;
  is_verified: boolean;
  is_banned: boolean;
  is_online: boolean;
  last_seen_at: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserLocation {
  user_id: string;
  city: string | null;
  country: string | null;
  accuracy_meters: number | null;
  updated_at: string;
}

export interface ConnectionRequest {
  id: number;
  requester_id: string;
  addressee_id: string;
  status: RequestStatus;
  created_at: string;
  responded_at: string | null;
}

export interface ChatThread {
  id: string;
  connection_request_id: number | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatParticipant {
  thread_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: number;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

/** Result row from get_nearby_users() RPC */
export interface NearbyUser {
  id: string;
  name: string | null;
  photo_url: string | null;
  profession: string | null;
  native_city: string | null;
  distance_km: number;
}

/** Chat thread with the other participant's profile attached */
export interface EnrichedThread extends ChatThread {
  other_user: Pick<Profile, 'id' | 'name' | 'photo_url' | 'is_online' | 'last_seen_at'>;
}

export function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Profile;
}

export interface Like {
  post_id: string;
  user_id: string;
  created_at: string;
}
