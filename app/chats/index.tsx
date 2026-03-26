import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Check, CheckCheck } from 'lucide-react-native';

export default function ChatsList() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();

    const channel = supabase.channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
         fetchChats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;
    try {
      const { data: conns } = await supabase
         .from('connections')
         .select(`
            id,
            requester_id,
            requester:profiles!connections_requester_id_fkey(id, full_name, username, avatar_url),
            addressee:profiles!connections_addressee_id_fkey(id, full_name, username, avatar_url)
         `)
         .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
         .eq('status', 'accepted');

      const chatPromises = (conns || []).map(async (c: any) => {
         const otherUserObj = c.requester_id === user.id ? c.addressee : c.requester;
         const otherUser = Array.isArray(otherUserObj) ? otherUserObj[0] : otherUserObj;
         
         // latest msg
         const { data: msgs } = await supabase.from('messages').select('*').eq('connection_id', c.id).order('created_at', { ascending: false }).limit(1);
         // unread count
         const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true })
            .eq('connection_id', c.id).eq('is_read', false).neq('sender_id', user.id);

         return {
            id: c.id,
            otherUser,
            lastMessage: msgs?.[0] || null,
            unreadCount: count || 0
         };
      });

      let results = await Promise.all(chatPromises);
      results = results.filter(r => r.otherUser); // Safety
      results.sort((a, b) => {
         const dA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
         const dB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
         return dB - dA;
      });
      setChats(results);
    } catch(e) {} finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.chatRow} 
      onPress={() => router.push({ pathname: '/chats/[id]', params: { id: item.id, name: item.otherUser.full_name || item.otherUser.username } })}
    >
      <Image source={{ uri: item.otherUser.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }} style={styles.avatar} />
      <View style={styles.chatInfo}>
         <Text style={styles.chatName}>{item.otherUser.full_name || item.otherUser.username}</Text>
         <View style={styles.lastMsgRow}>
            {item.lastMessage?.sender_id === user?.id && (
               <CheckCheck size={14} color={item.lastMessage.is_read ? Colors.teal : Colors.textSecondary} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.lastMsgText, item.unreadCount > 0 && styles.lastMsgUnread]} numberOfLines={1}>
               {item.lastMessage ? item.lastMessage.content : 'Start a conversation'}
            </Text>
         </View>
      </View>
      <View style={styles.chatMeta}>
         {item.lastMessage && (
            <Text style={[styles.timeText, item.unreadCount > 0 && styles.timeTextUnread]}>
               {new Date(item.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
         )}
         {item.unreadCount > 0 && (
            <View style={styles.badge}>
               <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
         )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.text} size={24} />
         </TouchableOpacity>
         <Text style={styles.title}>Messages</Text>
         <View style={{ width: 24 }} />
      </View>
      {loading ? (
         <ActivityIndicator color={Colors.saffron} style={{ marginTop: 40 }} />
      ) : (
         <FlatList
            data={chats}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
               <View style={styles.emptyState}>
                 <Text style={styles.emptyTitle}>No messages yet</Text>
                 <Text style={styles.emptySub}>Connect with people on the Discover tab to start chatting.</Text>
               </View>
            }
         />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: Typography.display, color: Colors.text },
  
  list: { padding: 16 },
  chatRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 16 },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatName: { fontSize: 16, fontFamily: Typography.bodyBold, color: Colors.text, marginBottom: 4 },
  lastMsgRow: { flexDirection: 'row', alignItems: 'center' },
  lastMsgText: { flex: 1, fontSize: 13, fontFamily: Typography.body, color: Colors.textSecondary },
  lastMsgUnread: { color: Colors.text, fontFamily: Typography.bodyBold },
  
  chatMeta: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12 },
  timeText: { fontSize: 11, fontFamily: Typography.body, color: Colors.textSecondary, marginBottom: 6 },
  timeTextUnread: { color: Colors.saffron, fontFamily: Typography.bodyBold },
  badge: { backgroundColor: Colors.saffron, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: Typography.bodyBold },

  emptyState: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 }
});
