import { supabase, Message, ChatThread, EnrichedThread } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ChatRepo } from '@/lib/repositories/chat.repo';
import { AppError } from '@/lib/errors/app-error';

export const ChatService = {
  async getMyThreads(): Promise<EnrichedThread[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const threadIds = await this.getMyThreadIds(user.id);
    if (!threadIds.length) return [];
    const threads = await this.getThreads(threadIds);
    return Promise.all(threads.map(async t => {
      const otherId = await this.getOtherParticipant(t.id, user.id);
      let profile = null;
      if (otherId) {
        const { data } = await supabase.from('profiles').select('id, name, photo_url, is_online, last_seen_at').eq('id', otherId).single();
        profile = data;
      }
      return { ...t, other_user: profile || {} } as EnrichedThread;
    }));
  },

  async getMyThreadIds(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('chat_participants')
      .select('thread_id')
      .eq('user_id', userId);
    return (data ?? []).map(r => r.thread_id);
  },

  async getThreads(threadIds: string[]): Promise<ChatThread[]> {
    if (!threadIds.length) return [];
    const { data } = await supabase
      .from('chat_threads')
      .select('*')
      .in('id', threadIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });
    return (data ?? []) as ChatThread[];
  },

  async getOtherParticipant(threadId: string, myUserId: string): Promise<string | null> {
    const { data } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('thread_id', threadId)
      .neq('user_id', myUserId)
      .single();
    return data?.user_id ?? null;
  },

  async getMessages(threadId: string): Promise<Message[]> {
    const { data, error } = await ChatRepo.fetchMessages(threadId);
    if (error) throw new AppError(error.message, 'FETCH_MESSAGES');
    return (data ?? []) as Message[];
  },

  async sendMessage(threadId: string, body: string): Promise<void> {
    if (!body.trim()) throw new AppError('Message cannot be empty', 'VALIDATION');
    const { error } = await supabase.functions.invoke('send-message', {
      body: { threadId, text: body },
    });
    if (error) throw new AppError(error.message, 'SEND_MESSAGE');
  },

  async markRead(messageIds: number[]): Promise<void> {
    if (!messageIds.length) return;
    await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', messageIds);
  },

  subscribeToMessages(threadId: string, callback: (msg: Message) => void): RealtimeChannel {
    return supabase
      .channel(`chat-${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `thread_id=eq.${threadId}`,
      }, (payload) => callback(payload.new as Message))
      .subscribe();
  },

  subscribeToThreadUpdates(callback: (thread: ChatThread) => void): RealtimeChannel {
    return supabase
      .channel('thread-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_threads' },
        (payload) => callback(payload.new as ChatThread))
      .subscribe();
  },

  unsubscribe(channel: RealtimeChannel): void {
    supabase.removeChannel(channel);
  },
};
