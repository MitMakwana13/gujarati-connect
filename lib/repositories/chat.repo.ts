import { supabase } from '@/lib/supabase';

export const ChatRepo = {
  async fetchMessages(threadId: string) {
    return supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at');
  },

  async insertMessage(threadId: string, senderId: string, body: string) {
    return supabase.from('messages').insert({
      thread_id: threadId,
      sender_id: senderId,
      body,
    });
  },
};
