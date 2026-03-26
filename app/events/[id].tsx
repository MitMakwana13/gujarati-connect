import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, Image, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Share, Dimensions, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import MapView, { Marker } from 'react-native-maps';
import {
  ArrowLeft, MapPin, Calendar, Ticket, Users, Share2, Check, Clock
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator:profiles!events_creator_id_fkey(id, full_name, username, avatar_url),
          event_rsvps(user_id, status, attendee:profiles!event_rsvps_user_id_fkey(id, full_name, username, avatar_url))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const myRsvp = data.event_rsvps.find((r: any) => r.user_id === user?.id);
      setMyStatus(myRsvp?.status || null);

      const going = data.event_rsvps
        .filter((r: any) => r.status === 'going')
        .map((r: any) => {
          const att = Array.isArray(r.attendee) ? r.attendee[0] : r.attendee;
          return att;
        })
        .filter(Boolean);

      setAttendees(going);
      setEvent(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleRSVP = async () => {
    if (!user || rsvpLoading) return;
    setRsvpLoading(true);
    const newStatus = myStatus === 'going' ? null : 'going';
    const prevStatus = myStatus;
    setMyStatus(newStatus);

    try {
      if (!newStatus) {
        await supabase.from('event_rsvps').delete().match({ event_id: id, user_id: user.id });
      } else {
        await supabase.from('event_rsvps').upsert({ event_id: id, user_id: user.id, status: newStatus });
      }
      await fetchEvent();
    } catch (e) {
      setMyStatus(prevStatus);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Join me at ${event.title} on ${new Date(event.event_date).toLocaleDateString()}!\n${event.location_name || event.city || ''}`,
        title: event.title,
      });
    } catch (e) {}
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.saffron} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Event not found.</Text>
      </SafeAreaView>
    );
  }

  const isGoing = myStatus === 'going';
  const creator = Array.isArray(event.creator) ? event.creator[0] : event.creator;
  // Try to extract lat/lng from PostGIS geography if present
  const hasLocation = event.location && event.location.coordinates;
  const lng = hasLocation ? event.location.coordinates[0] : null;
  const lat = hasLocation ? event.location.coordinates[1] : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: event.banner_color || Colors.surface2 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.heroEmoji}>{event.banner_emoji || '🎉'}</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Share2 color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Title & Category */}
          <View style={styles.categoryRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{event.category?.toUpperCase()}</Text>
            </View>
            <Text style={styles.ticketBadge}>{event.ticket_price || 'Free'}</Text>
          </View>
          <Text style={styles.title}>{event.title}</Text>

          {/* Info Cards */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Calendar size={20} color={Colors.saffron} />
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(event.event_date)}</Text>
            </View>
            <View style={styles.infoCard}>
              <Clock size={20} color={Colors.tealLight} />
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formatTime(event.event_date)}</Text>
            </View>
            <View style={styles.infoCard}>
              <MapPin size={20} color={Colors.saffron} />
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{event.location_name || event.city || 'TBD'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Users size={20} color={Colors.tealLight} />
              <Text style={styles.infoLabel}>Capacity</Text>
              <Text style={styles.infoValue}>{event.max_attendees ? `${attendees.length} / ${event.max_attendees}` : `${attendees.length} going`}</Text>
            </View>
          </View>

          {/* Description */}
          {event.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this Event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          ) : null}

          {/* Organizer */}
          {creator && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organizer</Text>
              <View style={styles.organizerRow}>
                <Image
                  source={{ uri: creator.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }}
                  style={styles.organizerAvatar}
                />
                <View>
                  <Text style={styles.organizerName}>{creator.full_name || creator.username}</Text>
                  <Text style={styles.organizerSub}>@{creator.username}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Map */}
          {lat && lng ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <MapView
                style={styles.map}
                initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                scrollEnabled={false}
              >
                <Marker coordinate={{ latitude: lat, longitude: lng }} title={event.location_name || event.title} />
              </MapView>
            </View>
          ) : null}

          {/* Attendees */}
          {attendees.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Who's Going ({attendees.length})</Text>
              <View style={styles.attendeesGrid}>
                {attendees.slice(0, 12).map((att: any) => (
                  <View key={att.id} style={styles.attendeeItem}>
                    <Image
                      source={{ uri: att.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }}
                      style={styles.attendeeAvatar}
                    />
                    <Text style={styles.attendeeName} numberOfLines={1}>{att.full_name?.split(' ')[0] || att.username}</Text>
                  </View>
                ))}
                {attendees.length > 12 && (
                  <View style={styles.attendeeMore}>
                    <Text style={styles.attendeeMoreText}>+{attendees.length - 12}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky RSVP Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={[styles.rsvpBtn, isGoing ? styles.rsvpBtnGoing : styles.rsvpBtnDefault]}
          onPress={toggleRSVP}
          disabled={rsvpLoading}
        >
          {rsvpLoading ? (
            <ActivityIndicator color={isGoing ? Colors.background : Colors.saffron} />
          ) : (
            <>
              {isGoing && <Check size={20} color={Colors.background} style={{ marginRight: 8 }} />}
              <Text style={[styles.rsvpText, isGoing ? styles.rsvpTextGoing : styles.rsvpTextDefault]}>
                {isGoing ? "You're Going!" : 'Mark as Going'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontFamily: Typography.body, fontSize: 16 },
  backRow: { padding: 20 },

  heroBanner: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8,
  },
  shareBtn: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8,
  },
  heroEmoji: { fontSize: 64 },

  body: { padding: 20 },

  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  categoryChip: { backgroundColor: 'rgba(232,137,42,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  categoryText: { color: Colors.saffron, fontFamily: Typography.bodyBold, fontSize: 11, letterSpacing: 1 },
  ticketBadge: { color: Colors.tealLight, fontFamily: Typography.bodyBold, fontSize: 14 },
  title: { fontSize: 26, fontFamily: Typography.display, color: Colors.text, marginBottom: 20, lineHeight: 34 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  infoCard: {
    flex: 1, minWidth: (width - 56) / 2,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, gap: 6,
  },
  infoLabel: { fontSize: 11, fontFamily: Typography.bodyBold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.text, lineHeight: 18 },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.text, marginBottom: 14 },
  description: { fontSize: 15, fontFamily: Typography.body, color: Colors.textSecondary, lineHeight: 24 },

  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  organizerAvatar: { width: 48, height: 48, borderRadius: 24 },
  organizerName: { fontSize: 15, fontFamily: Typography.bodyBold, color: Colors.text },
  organizerSub: { fontSize: 13, fontFamily: Typography.body, color: Colors.textSecondary },

  map: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden' },

  attendeesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  attendeeItem: { alignItems: 'center', width: 60 },
  attendeeAvatar: { width: 52, height: 52, borderRadius: 26, marginBottom: 4, borderWidth: 2, borderColor: Colors.border },
  attendeeName: { fontSize: 11, fontFamily: Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  attendeeMore: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  attendeeMoreText: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.textSecondary },

  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  rsvpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 24, borderWidth: 1 },
  rsvpBtnDefault: { backgroundColor: 'rgba(232,137,42,0.1)', borderColor: Colors.saffron },
  rsvpBtnGoing: { backgroundColor: Colors.saffron, borderColor: Colors.saffron },
  rsvpText: { fontSize: 16, fontFamily: Typography.bodyBold },
  rsvpTextDefault: { color: Colors.saffron },
  rsvpTextGoing: { color: Colors.background },
});
