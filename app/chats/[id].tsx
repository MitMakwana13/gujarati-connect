import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Send } from 'lucide-react-native';

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const myTypingRef = useRef(false);

  useEffect(() => {
    fetchMessages();
    markAsRead();

    // Setup Realtime subscriptions
    const channel = supabase.channel(`room:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `connection_id=eq.${id}` }, (payload) => {
         setMessages(prev => [payload.new, ...prev]);
         if (payload.new.sender_id !== user?.id) {
            markAsRead();
         }
      })
      .on('presence', { event: 'sync' }, () => {
         const state = channel.presenceState();
         // Check if the OTHER user is typing
         const isOtherTyping = Object.values(state).some((presences: any) => 
            presences.some((p: any) => p.user_id !== user?.id && p.typing)
         );
         setTyping(isOtherTyping);
      })
      .subscribe(async (status) => {
         if (status === 'SUBSCRIBED') {
            await channel.track({ user_id: user?.id, typing: false });
         }
      });

    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  // Handle local typing state broadcast
  useEffect(() => {
     const isTyping = input.length > 0;
     if (isTyping !== myTypingRef.current) {
        myTypingRef.current = isTyping;
        supabase.channel(`room:${id}`).track({ user_id: user?.id, typing: isTyping });
     }
  }, [input]);

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('connection_id', id).order('created_at', { ascending: false });
    if (data) setMessages(data);
  };

  const markAsRead = async () => {
    if (!user) return;
    await supabase.from('messages')
      .update({ is_read: true })
      .eq('connection_id', id)
      .neq('sender_id', user.id)
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const msg = input.trim();
    setInput('');
    
    await supabase.from('messages').insert({
       connection_id: id,
       sender_id: user.id,
       content: msg
    });
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === user?.id;
    return (
       <View style={[styles.msgWrapper, isMe ? styles.msgRight : styles.msgLeft]}>
          <View style={[styles.msgBubble, isMe ? styles.msgBubbleSent : styles.msgBubbleRecv]}>
             <Text style={[styles.msgText, isMe ? styles.msgTextSent : styles.msgTextRecv]}>{item.content}</Text>
          </View>
       </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
               <ArrowLeft color={Colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{name}</Text>
            <View style={{ width: 24 }} />
         </View>

         <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id.toString()}
            inverted
            contentContainerStyle={styles.messageList}
         />

         {typing && (
            <View style={styles.typingContainer}>
               <Text style={styles.typingText}>typing...</Text>
            </View>
         )}

         <View style={styles.inputArea}>
            <TextInput
               style={styles.input}
               placeholder="Type a message..."
               placeholderTextColor={Colors.textSecondary}
               value={input}
               onChangeText={setInput}
               multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={!input.trim()}>
               <Send size={20} color={input.trim() ? Colors.saffron : Colors.textSecondary} />
            </TouchableOpacity>
         </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.text },
  
  messageList: { padding: 20, paddingTop: 40 },
  msgWrapper: { marginBottom: 12, width: '100%', flexDirection: 'row' },
  msgLeft: { justifyContent: 'flex-start' },
  msgRight: { justifyContent: 'flex-end' },
  msgBubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  msgBubbleSent: { backgroundColor: Colors.saffron, borderBottomRightRadius: 4 },
  msgBubbleRecv: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderTopLeftRadius: 4 },
  msgText: { fontSize: 15, fontFamily: Typography.body, lineHeight: 22 },
  msgTextSent: { color: '#fff' },
  msgTextRecv: { color: Colors.text },

  typingContainer: { paddingHorizontal: 24, paddingBottom: 8 },
  typingText: { color: Colors.saffron, fontFamily: Typography.body, fontSize: 12, fontStyle: 'italic' },

  inputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, paddingTop: 12, color: Colors.text, fontFamily: Typography.body, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', marginLeft: 12, marginBottom: 2 },
});
