import { supabase, ConnectionRequest, RequestStatus } from '@/lib/supabase';
import { AppError } from '@/lib/errors/app-error';

export const ConnectionService = {
  async sendRequest(toUserId: string) {
    const { error } = await supabase.functions.invoke('send-request', {
      body: { toUserId }
    });
    if (error) throw new AppError(error.message, 'SEND_REQUEST');
  },

  async respondToRequest(requestId: number, status: 'accepted' | 'rejected') {
    const { error } = await supabase
      .from('connection_requests')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  async getMyRequests(): Promise<ConnectionRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('connection_requests')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    return (data ?? []) as ConnectionRequest[];
  },

  async getConnectionStatus(myId: string, otherUserId: string): Promise<RequestStatus | 'none'> {
    const { data } = await supabase
      .from('connection_requests')
      .select('status')
      .or(
        `and(requester_id.eq.${myId},addressee_id.eq.${otherUserId}),` +
        `and(requester_id.eq.${otherUserId},addressee_id.eq.${myId})`
      )
      .maybeSingle();
    return (data?.status as RequestStatus) ?? 'none';
  },

  async cancelRequest(requestId: number) {
    return supabase.from('connection_requests').update({ status: 'cancelled' }).eq('id', requestId);
  },
};
