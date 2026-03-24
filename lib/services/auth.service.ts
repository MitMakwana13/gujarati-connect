import { supabase } from '@/lib/supabase';

export const AuthService = {
  async loginWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  },

  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  async logout() {
    return supabase.auth.signOut();
  },
};
