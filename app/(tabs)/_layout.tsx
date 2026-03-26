import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Telescope, Globe, PartyPopper, User, MessageCircle } from 'lucide-react-native';
import { TouchableOpacity, View, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

function ChatHeaderIcon() {
  const { user } = useAuth();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false)
          .neq('sender_id', user.id);
        if (count !== null) setUnread(count);
      } catch (e) {}
    };
    fetchUnread();
    const channel = supabase.channel('public:messages:header')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => { fetchUnread(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <TouchableOpacity onPress={() => router.push('/chats' as any)} style={{ marginRight: 20, position: 'relative' }}>
       <MessageCircle size={24} color={Colors.text} />
       {unread > 0 && (
         <View style={{ position: 'absolute', top: -5, right: -6, backgroundColor: Colors.saffron, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{unread > 99 ? '99+' : unread}</Text>
         </View>
       )}
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.saffron,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerRight: () => <ChatHeaderIcon />,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 84,
          paddingBottom: 28,
          paddingTop: 12,
        },
        headerStyle: { backgroundColor: Colors.background },
        headerTitleStyle: { color: Colors.text, fontFamily: 'PlayfairDisplay_700Bold' },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tab_discover'), tabBarIcon: ({ color, size }) => <Telescope size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="community"
        options={{ title: t('tab_community'), tabBarIcon: ({ color, size }) => <Globe size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: t('tab_events'), tabBarIcon: ({ color, size }) => <PartyPopper size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tab_profile'), tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }}
      />
    </Tabs>
  );
}
