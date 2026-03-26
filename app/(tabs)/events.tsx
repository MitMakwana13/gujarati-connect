import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Calendar, Users, Ticket, Plus, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const FILTERS = ['All Events', 'This Month', 'Near Me', 'Business', 'Cultural', 'Social', 'Religious', 'Sports'];

const AVATAR_COLORS = [
  ['#E8892A', '#C46C10'],
  ['#1AAEA3', '#0D7A70'],
  ['#5B8FD4', '#2C5FA0'],
  ['#D4A843', '#9A7220'],
];

export default function EventsScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [events, setEvents] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All Events');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // We refetch when screen gets focus and filters change
  useFocusEffect(
    useCallback(() => {
       fetchEvents();
    }, [activeFilter])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
         .from('events')
         .select(`*, event_rsvps(user_id, status)`)
         .order('event_date', { ascending: true });
         
      if (activeFilter !== 'All Events') {
         if (activeFilter === 'This Month') {
            const start = new Date();
            start.setDate(1);
            const end = new Date(start);
            end.setMonth(end.getMonth() + 1);
            query = query.gte('event_date', start.toISOString()).lt('event_date', end.toISOString());
         } else if (activeFilter === 'Near Me') {
            if (profile?.current_city) {
               query = query.ilike('city', `%${profile.current_city}%`);
            }
         } else {
            // Category filter
            query = query.eq('category', activeFilter.toLowerCase());
         }
      }

      // Hide past events
      query = query.gte('event_date', new Date().toISOString());

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map(evt => {
         const myRsvp = evt.event_rsvps.find((r: any) => r.user_id === user.id);
         const goingCount = evt.event_rsvps.filter((r: any) => r.status === 'going').length;
         return {
            ...evt,
            myStatus: myRsvp ? myRsvp.status : null,
            goingCount
         };
      });

      setEvents(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleRSVP = async (eventId: string, currentStatus: string | null) => {
     if (!user) return;
     const newStatus = currentStatus === 'going' ? null : 'going';
     
     // Opt UI
     setEvents(prev => prev.map(e => {
        if (e.id === eventId) {
           const wasGoing = currentStatus === 'going';
           const isGoing = newStatus === 'going';
           let count = e.goingCount;
           if (wasGoing && !isGoing) count--;
           else if (!wasGoing && isGoing) count++;
           return { ...e, myStatus: newStatus, goingCount: Math.max(0, count) };
        }
        return e;
     }));

     try {
        if (!newStatus) {
           await supabase.from('event_rsvps').delete().match({ event_id: eventId, user_id: user.id });
        } else {
           await supabase.from('event_rsvps').upsert({ event_id: eventId, user_id: user.id, status: newStatus });
        }
     } catch(e) {
        fetchEvents(); // revert
     }
  };

  const parseDate = (iso: string) => {
     const d = new Date(iso);
     const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
     const day = d.getDate();
     const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
     return { month, day, time };
  };

  const renderEvent = ({ item }: { item: any }) => {
     const { month, day, time } = parseDate(item.event_date);
     const isGoing = item.myStatus === 'going';

     return (
        <TouchableOpacity
           style={styles.card}
           activeOpacity={0.9}
           onPress={() => router.push({ pathname: '/events/[id]' as any, params: { id: item.id } })}
        >
           {/* Banner */}
           <View style={[styles.banner, { backgroundColor: item.banner_color || Colors.surface2 }]}>
              <Text style={styles.bannerEmoji}>{item.banner_emoji || '🎉'}</Text>
              {/* Dark gradient overlay at bottom */}
              <View style={styles.bannerOverlay} />
              {/* Date badge */}
              <View style={styles.dateBadge}>
                 <Text style={styles.badgeDay}>{day}</Text>
                 <Text style={styles.badgeMonth}>{month}</Text>
              </View>
           </View>

           {/* Body */}
           <View style={styles.cardBody}>
              <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.detailRow}>
                 <Text style={styles.detailIcon}>📍</Text>
                 <Text style={styles.detailText} numberOfLines={1}>{item.location_name || item.city}</Text>
              </View>
              <View style={styles.detailRow}>
                 <Text style={styles.detailIcon}>🕗</Text>
                 <Text style={styles.detailText}>{time}</Text>
              </View>
              <View style={styles.detailRow}>
                 <Text style={styles.detailIcon}>🎟️</Text>
                 <Text style={styles.detailText}>{item.ticket_price || 'Free'} · {item.goingCount} attending</Text>
              </View>
           </View>

           {/* Footer */}
           <View style={styles.cardFooter}>
              <View style={styles.goingRow}>
                 {[0, 1, 2].map((i) => (
                    <View key={i} style={[styles.miniAvatar, { backgroundColor: AVATAR_COLORS[i % 4][0], marginLeft: i === 0 ? 0 : -7 }]}>
                       <Text style={styles.miniAvatarText}>{String.fromCharCode(65 + i)}</Text>
                    </View>
                 ))}
                 <Text style={styles.goingText}>+{item.goingCount} going</Text>
              </View>
              <TouchableOpacity
                 style={[styles.rsvpBtn, isGoing && styles.rsvpBtnGoing]}
                 onPress={(e: any) => { e.preventDefault?.(); toggleRSVP(item.id, item.myStatus); }}
              >
                 <Text style={[styles.rsvpText, isGoing && styles.rsvpTextGoing]}>
                    {isGoing ? 'Going ✓' : 'Interested'}
                 </Text>
              </TouchableOpacity>
           </View>
        </TouchableOpacity>
     );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <Text style={styles.title}>Events</Text>
      </View>

      <View style={styles.filterWrapper}>
         <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTERS}
            keyExtractor={item => item}
            renderItem={({item}) => (
               <TouchableOpacity 
                  style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
                  onPress={() => setActiveFilter(item)}
               >
                  <Text style={[styles.filterChipText, activeFilter === item && styles.filterChipTextActive]}>{item}</Text>
               </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingHorizontal: 20 }}
         />
      </View>

      <FlatList
         data={events}
         renderItem={renderEvent}
         keyExtractor={item => item.id}
         contentContainerStyle={styles.listContent}
         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.saffron} />}
         ListEmptyComponent={loading ? <ActivityIndicator color={Colors.saffron} style={{ marginTop: 40 }} /> : (
            <View style={styles.emptyState}>
               <Text style={styles.emptyTitle}>No events found</Text>
               <Text style={styles.emptySub}>Be the first to create one!</Text>
            </View>
         )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/events/create' as any)}>
         <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.fabGradient}>
            <Plus size={28} color="#fff" />
         </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  title: { fontSize: 28, fontFamily: Typography.display, color: Colors.text },

  filterWrapper: { marginBottom: 12 },
  filterChip: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  filterChipActive: { backgroundColor: 'rgba(232,137,42,0.10)', borderColor: 'rgba(232,137,42,0.40)' },
  filterChipText: { color: Colors.textSecondary, fontFamily: Typography.bodySemiBold, fontSize: 12 },
  filterChipTextActive: { color: Colors.saffronLight, fontFamily: Typography.bodyBold },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  card: { backgroundColor: Colors.surface, borderRadius: 18, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  banner: { height: 88, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  bannerEmoji: { fontSize: 48, position: 'relative', zIndex: 2 },
  bannerOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.4))' },
  dateBadge: { position: 'absolute', top: 10, left: 12, zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  badgeDay: { fontFamily: Typography.display, fontSize: 20, color: Colors.saffron, lineHeight: 22 },
  badgeMonth: { fontSize: 9, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: Typography.bodyBold },

  cardBody: { padding: 12 },
  eventTitle: { fontSize: 14, fontFamily: Typography.bodyBold, color: Colors.text, marginBottom: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  detailIcon: { fontSize: 11, marginRight: 5 },
  detailText: { fontSize: 11, fontFamily: Typography.body, color: Colors.textSecondary },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.border, marginHorizontal: 6 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 16, paddingVertical: 10 },

  goingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { fontSize: 8, fontFamily: Typography.bodyBold, color: '#fff' },
  goingText: { fontSize: 11, color: Colors.textSecondary, fontFamily: Typography.body },

  attendeesBox: { flexDirection: 'row', alignItems: 'center' },
  attendeeText: { fontSize: 11, fontFamily: Typography.bodyBold, color: Colors.textSecondary },

  rsvpBtn: { height: 32, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  rsvpBtnGoing: { backgroundColor: Colors.saffron, borderColor: Colors.saffron },
  rsvpBtnDefault: { backgroundColor: 'transparent' },
  rsvpText: { fontFamily: Typography.bodyBold, fontSize: 12 },
  rsvpTextDefault: { color: Colors.text },
  rsvpTextGoing: { color: '#fff' },

  emptyState: { padding: 40, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: Typography.body, color: Colors.textSecondary, textAlign: 'center' },

  fab: { position: 'absolute', bottom: 20, right: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});

