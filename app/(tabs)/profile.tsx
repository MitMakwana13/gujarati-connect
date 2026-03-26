import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { Settings, Edit3, MapPin, UserCheck, X, MessageCircle, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const CollapsibleCard = ({ title, defaultOpen = true, children }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => {
     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
     setOpen(!open);
  };
  return (
    <View style={styles.collapsibleCard}>
       <TouchableOpacity style={styles.collapsibleHeader} onPress={toggle} activeOpacity={0.7}>
          <Text style={styles.collapsibleTitle}>{title}</Text>
          <ChevronDown color={Colors.textSecondary} size={20} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
       </TouchableOpacity>
       {open && <View style={styles.collapsibleContent}>{children}</View>}
    </View>
  );
};

export default function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<any[]>([]);
  const [network, setNetwork] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // We use useFocusEffect to refresh profile in case they just returned from edit profile
  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
      fetchData();
    }, [])
  );

  useEffect(() => {
    // Listen for new requests / connections
    const channel = supabase.channel('public:connections:profile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => {
         fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: reqData } = await supabase
        .from('connections')
        .select(`id, requester:profiles!connections_requester_id_fkey(id, full_name, username, avatar_url, industry)`)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');
      
      setRequests(reqData || []);

      const { data: netData } = await supabase
        .from('connections')
        .select(`
          id, requester_id,
          requester:profiles!connections_requester_id_fkey(id, full_name, username, avatar_url, industry, current_city),
          addressee:profiles!connections_addressee_id_fkey(id, full_name, username, avatar_url, industry, current_city)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const mappedNet = (netData || []).map((row: any) => {
        const otherUser = row.requester_id === user.id ? row.addressee : row.requester;
        const otherUserObj = Array.isArray(otherUser) ? otherUser[0] : otherUser;
        return { connectionId: row.id, ...otherUserObj };
      });
      setNetwork(mappedNet);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (connectionId: string, accept: boolean) => {
    try {
       if (accept) {
          await supabase.from('connections').update({ status: 'accepted' }).eq('id', connectionId);
       } else {
          await supabase.from('connections').delete().eq('id', connectionId);
       }
       fetchData();
    } catch(e) {}
  };

  // Safe checks for arrays
  const languagesList = Array.isArray(profile?.languages) ? profile.languages.join(', ') : profile?.languages || 'Gujarati';
  const interestsList = Array.isArray(profile?.interests) ? profile.interests : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header / Hero */}
        <View style={styles.heroSection}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.push('/edit-profile')} style={styles.iconBtn}>
              <Edit3 size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBtn}>
              <Settings size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarRing}>
                {profile?.avatar_url
                  ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                  : <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>
                        {(profile?.full_name || profile?.username || 'M').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                }
              </View>
            </View>

            <Text style={styles.name}>{profile?.full_name || profile?.username || 'Member'}</Text>
            <Text style={styles.usernameText}>@{profile?.username || 'user'} · {profile?.current_city || 'City'}</Text>

            {profile?.bio && (
               <Text style={styles.bioText}>{profile.bio}</Text>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, styles.statBorder]}>
              <Text style={styles.statValue}>{network.length}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
            <View style={[styles.statBox, styles.statBorder]}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Communities</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>45</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Data Sections */}
        {loading ? (
          <ActivityIndicator color={Colors.saffron} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.contentSections}>
            {/* Pending Requests */}
            {requests.length > 0 && (
              <View style={styles.requestsWrapper}>
                <Text style={styles.sectionTitle}>Connection Requests</Text>
                {requests.map((req) => {
                   const reqUser = Array.isArray(req.requester) ? req.requester[0] : req.requester;
                   return (
                     <View key={req.id} style={styles.requestCard}>
                       <Image source={{ uri: reqUser?.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }} style={styles.reqAvatar} />
                       <View style={styles.reqInfo}>
                         <Text style={styles.reqName} numberOfLines={1}>{reqUser?.full_name || reqUser?.username}</Text>
                         <Text style={styles.reqMeta} numberOfLines={1}>{reqUser?.industry || 'Member'}</Text>
                       </View>
                       <View style={styles.reqActions}>
                         <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRequest(req.id, false)}>
                           <X size={16} color={Colors.textSecondary} />
                         </TouchableOpacity>
                         <TouchableOpacity style={styles.acceptBtn} onPress={() => handleRequest(req.id, true)}>
                           <UserCheck size={16} color={Colors.background} />
                         </TouchableOpacity>
                       </View>
                     </View>
                   );
                })}
              </View>
            )}

            {/* Collapsible Info Cards */}
            <CollapsibleCard title="Origin & Identity" defaultOpen={true}>
               <View style={styles.infoRow}>
                 <Text style={styles.infoIcon}>🏡</Text>
                 <Text style={styles.infoLabel}>Hometown</Text>
                 <Text style={styles.infoValue}>{profile?.hometown || '—'}</Text>
               </View>
               <View style={styles.infoRow}>
                 <Text style={styles.infoIcon}>🗣️</Text>
                 <Text style={styles.infoLabel}>Languages</Text>
                 <Text style={styles.infoValue}>{languagesList}</Text>
               </View>
               {profile?.community && (
                 <View style={styles.infoRow}>
                   <Text style={styles.infoIcon}>🛕</Text>
                   <Text style={styles.infoLabel}>Community</Text>
                   <Text style={styles.infoValue}>{profile.community}</Text>
                 </View>
               )}
               <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                 <Text style={styles.infoIcon}>📍</Text>
                 <Text style={styles.infoLabel}>Now based in</Text>
                 <Text style={styles.infoValue}>{profile?.current_city || '—'}</Text>
               </View>
            </CollapsibleCard>

            <CollapsibleCard title="Professional" defaultOpen={false}>
               <View style={styles.infoRow}>
                 <Text style={styles.infoIcon}>💼</Text>
                 <Text style={styles.infoLabel}>Industry</Text>
                 <Text style={styles.infoValue}>{profile?.industry || '—'}</Text>
               </View>
               <View style={styles.infoRow}>
                 <Text style={styles.infoIcon}>🏢</Text>
                 <Text style={styles.infoLabel}>Role</Text>
                 <Text style={styles.infoValue}>{profile?.role || '—'}</Text>
               </View>
               <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                 <Text style={styles.infoIcon}>🎓</Text>
                 <Text style={styles.infoLabel}>Education</Text>
                 <Text style={styles.infoValue}>{profile?.education || '—'}</Text>
               </View>
            </CollapsibleCard>

            <CollapsibleCard title="Skills & Interests" defaultOpen={true}>
               {interestsList.length > 0 ? (
                 <View style={styles.tagsContainer}>
                    {interestsList.map((tag: string, idx: number) => (
                       <View key={idx} style={styles.tagPill}>
                         <Text style={styles.tagText}>{tag}</Text>
                       </View>
                    ))}
                 </View>
               ) : (
                 <Text style={styles.emptyText}>No interests added yet.</Text>
               )}
            </CollapsibleCard>

            {/* My Network */}
            {network.length > 0 && (
              <View style={[styles.requestsWrapper, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>My Network</Text>
                {network.map((conn) => (
                   <View key={conn.connectionId} style={styles.networkCard}>
                     <Image source={{ uri: conn.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }} style={styles.netAvatar} />
                     <View style={styles.netInfo}>
                       <Text style={styles.netName} numberOfLines={1}>{conn.full_name || conn.username}</Text>
                       <Text style={styles.netMeta} numberOfLines={1}>{conn.current_city || 'City'} • {conn.industry || 'Professional'}</Text>
                     </View>
                     <TouchableOpacity style={styles.msgBtn} onPress={() => router.push({ pathname: '/chats/[id]' as any, params: { id: conn.connectionId, name: conn.full_name || conn.username } })}>
                       <MessageCircle size={18} color="#fff" />
                     </TouchableOpacity>
                   </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 100 },

  // Hero section — dark gradient matching reference profile-hero
  heroSection: {
    paddingTop: 16, paddingBottom: 28, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: 'rgba(20,21,24,0.85)',
    alignItems: 'center',
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },

  profileInfo: { alignItems: 'center', marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 14 },
  // Saffron ring — rendered as outer View with border
  avatarRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2.5, borderColor: Colors.saffron, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.saffronDark, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: Typography.display, fontSize: 32, color: '#fff' },

  name: { fontSize: 24, fontFamily: Typography.display, color: Colors.text, marginBottom: 4, textAlign: 'center' },
  usernameText: { fontSize: 12, fontFamily: Typography.bodySemiBold, color: Colors.saffronLight, marginBottom: 10, textAlign: 'center' },
  bioText: { fontSize: 13, fontFamily: Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 16, lineHeight: 20 },

  // Stats row — 3 equal sections with Playfair numbers
  statsRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', width: '100%' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: Colors.surface },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statValue: { fontSize: 20, fontFamily: Typography.display, color: Colors.text, marginBottom: 2 },
  statLabel: { fontSize: 9, fontFamily: Typography.bodyBold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },

  contentSections: { padding: 16 },

  // Section title
  sectionTitle: { fontSize: 10, fontFamily: Typography.bodyBold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },

  // Info cards — reference style: card with titled header + rows
  collapsibleCard: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, overflow: 'hidden' },
  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  collapsibleTitle: { fontSize: 11, fontFamily: Typography.bodyBold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  collapsibleContent: { paddingHorizontal: 16, paddingBottom: 12, borderTopWidth: 1, borderTopColor: Colors.border },

  // Info row — 3-column layout: emoji | label | value (matches reference exactly)
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  infoIcon: { fontSize: 16, width: 26, textAlign: 'center', marginRight: 10 },
  infoLabel: { fontSize: 11, fontFamily: Typography.bodyBold, color: Colors.textTertiary, width: 90 },
  infoValue: { flex: 1, fontSize: 13, fontFamily: Typography.body, color: Colors.text, textAlign: 'right' },

  // Skill tags — teal pills matching reference
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 8 },
  tagPill: { backgroundColor: 'rgba(19,138,128,0.10)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(26,174,163,0.3)' },
  tagText: { color: Colors.tealLight, fontFamily: Typography.bodySemiBold, fontSize: 12 },
  emptyText: { color: Colors.textSecondary, fontFamily: Typography.body, fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },

  // Connection Requests
  requestsWrapper: { marginBottom: 20 },
  requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  reqAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reqInfo: { flex: 1 },
  reqName: { fontSize: 14, fontFamily: Typography.bodyBold, color: Colors.text, marginBottom: 2 },
  reqMeta: { fontSize: 11, fontFamily: Typography.body, color: Colors.textSecondary },
  reqActions: { flexDirection: 'row', gap: 8 },
  rejectBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  acceptBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.saffron, alignItems: 'center', justifyContent: 'center' },

  // Network cards
  networkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  netAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  netInfo: { flex: 1 },
  netName: { fontSize: 14, fontFamily: Typography.bodyBold, color: Colors.text, marginBottom: 2 },
  netMeta: { fontSize: 11, fontFamily: Typography.body, color: Colors.textSecondary },
  msgBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
});

