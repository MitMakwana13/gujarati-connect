import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Dimensions, Image, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import { supabase } from '@/lib/supabase';
import { Colors, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Navigation2, Check, UserPlus, Globe2, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AVATAR_PALETTES = [
  ['#E8892A', '#C46C10'],
  ['#1AAEA3', '#0D7A70'],
  ['#5B8FD4', '#2C5FA0'],
  ['#D4A843', '#9A7220'],
  ['#DC2626', '#991B1B'],
];

const { width } = Dimensions.get('window');

interface NearbyUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  current_city: string;
  industry: string;
  role: string;
  interests: string[];
  distance_km: number;
  lat?: number;
  lng?: number;
}

// Pseudo-random deterministic placement 
const hashString = (str: string) => str.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);

const generateSyntheticCoords = (userLat: number, userLng: number, distanceKm: number, seed: string) => {
   const angle = (Math.abs(hashString(seed)) % 360) * (Math.PI / 180);
   const latOffset = (distanceKm / 111) * Math.cos(angle);
   const lngOffset = (distanceKm / (111 * Math.cos(userLat * Math.PI / 180))) * Math.sin(angle);
   return { latitude: userLat + latOffset, longitude: userLng + lngOffset };
};

export default function DiscoverScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(25);
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const [selectedPin, setSelectedPin] = useState<NearbyUser | null>(null);
  const [stats, setStats] = useState({ totalMembers: 0, countries: 0 });

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (mounted) setLoading(false);
        return;
      }
      try {
        let loc = await Location.getCurrentPositionAsync({});
        if (mounted) setLocation(loc);
        await fetchStats();
        await fetchConnections();
        await fetchNearbyUsers(loc.coords.latitude, loc.coords.longitude, 25);
      } catch(e) {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const fetchStats = async () => {
    try {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      setStats({ totalMembers: count || 1500, countries: 42 });
    } catch(e) {}
  };

  const fetchConnections = async () => {
    if (!user) return;
    const { data } = await supabase.from('connections').select('addressee_id').eq('requester_id', user.id);
    if (data) setConnections(new Set(data.map(c => c.addressee_id)));
  };

  const fetchNearbyUsers = async (lat: number, lng: number, radius: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('nearby_users', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radius
      });
      if (error) throw error;
      
      const mapped = (data || []).map((u: any) => {
         const dist = u.distance_km === 0 ? Math.random() * 2 : u.distance_km;
         const coords = generateSyntheticCoords(lat, lng, dist, u.id);
         return { ...u, lat: coords.latitude, lng: coords.longitude };
      });
      setNearbyUsers(mapped.filter((u: any) => u.id !== user?.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusRelease = (val: number) => {
    if (location) fetchNearbyUsers(location.coords.latitude, location.coords.longitude, val);
  };

  const connectWithUser = async (targetId: string) => {
    if (!user) return;
    const newSet = new Set(connections);
    newSet.add(targetId);
    setConnections(newSet);

    const { error } = await supabase.from('connections').insert({
      requester_id: user.id,
      addressee_id: targetId,
      status: 'pending'
    });
    if (error) {
       newSet.delete(targetId);
       setConnections(new Set(newSet));
       alert('Connection failed: ' + error.message);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Stats Bar */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.totalMembers >= 1000 ? `${(stats.totalMembers/1000).toFixed(1)}k` : stats.totalMembers}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.countries}</Text>
          <Text style={styles.statLabel}>Countries</Text>
        </View>
        {/* Highlight card = Nearby */}
        <View style={[styles.statCard, styles.statCardHighlight]}>
          <View style={styles.statCardAccentBar} />
          <Text style={[styles.statNum, styles.statNumSaffron]}>{nearbyUsers.length}</Text>
          <Text style={styles.statLabel}>Nearby</Text>
        </View>
      </View>

      {/* Section Title */}
      <View style={styles.secTitleRow}>
        <Text style={styles.secTitle}>Global Gujarati Map</Text>
        <View style={styles.secTitleLine} />
      </View>

      {/* Map Section */}
      <View style={styles.mapWrapper}>
        {location ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.3,
              longitudeDelta: 0.3,
            }}
            userInterfaceStyle="dark"
            showsUserLocation={true}
          >
            {nearbyUsers.map(u => (
               <Marker
                  key={u.id}
                  coordinate={{ latitude: u.lat!, longitude: u.lng! }}
                  onPress={() => setSelectedPin(u)}
               >
                 <View style={styles.pinContainer}>
                    <Image source={{ uri: u.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }} style={styles.pinAvatar} />
                    <View style={styles.pinArrow} />
                 </View>
               </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.mapLoading}>
            <ActivityIndicator color={Colors.saffron} />
          </View>
        )}

        {selectedPin && (
          <View style={styles.previewCard}>
             <Image source={{ uri: selectedPin.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }} style={styles.previewAvatar} />
             <View style={styles.previewInfo}>
                <Text style={styles.previewName} numberOfLines={1}>{selectedPin.full_name || selectedPin.username}</Text>
                <Text style={styles.previewMeta} numberOfLines={1}>{selectedPin.industry || 'Professional'}</Text>
                <View style={styles.previewDistRow}>
                   <Navigation2 size={10} color={Colors.tealLight} />
                   <Text style={styles.previewDistText}>{(selectedPin.distance_km || 0).toFixed(1)} km • {selectedPin.current_city}</Text>
                </View>
             </View>
             <TouchableOpacity style={styles.previewClose} onPress={() => setSelectedPin(null)}>
                <Text style={styles.previewCloseText}>✕</Text>
             </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Radius Slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>📍 Discovery radius</Text>
          <Text style={styles.sliderValue}>{Math.round(radiusKm)} km</Text>
        </View>
        <Slider
           style={styles.slider}
           minimumValue={1}
           maximumValue={100}
           step={1}
           value={radiusKm}
           onValueChange={setRadiusKm}
           onSlidingComplete={handleRadiusRelease}
           minimumTrackTintColor={Colors.saffron}
           maximumTrackTintColor={Colors.surface2}
           thumbTintColor={Colors.saffron}
        />
      </View>

      {/* Section: People nearby */}
      <View style={styles.secTitleRow}>
        <Text style={styles.secTitle}>People nearby</Text>
        <View style={styles.secTitleLine} />
      </View>

      {/* Directory Widget */}
      <TouchableOpacity
        style={styles.directoryWidget}
        onPress={() => router.push('/directory' as any)}
        activeOpacity={0.8}
      >
        <View style={styles.directoryLeft}>
          <Text style={styles.directoryEmoji}>🏢</Text>
          <View>
            <Text style={styles.directoryTitle}>Business Directory</Text>
            <Text style={styles.directorySub}>Find Gujarati-owned businesses near you</Text>
          </View>
        </View>
        <Text style={styles.directoryArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGridItem = ({ item }: { item: NearbyUser }) => {
    const isConnected = connections.has(item.id);
    // Deterministic avatar palette from id hash
    const paletteIdx = Math.abs(item.id.charCodeAt(0) + item.id.charCodeAt(1)) % AVATAR_PALETTES.length;
    const [c1, c2] = AVATAR_PALETTES[paletteIdx];
    const initials = (item.full_name || item.username || 'GU').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    return (
      <View style={styles.gridCard}>
        {/* Top card accent area */}
        <View style={styles.gridCardAccent} />
        {/* Avatar with gradient */}
        <LinearGradient colors={[c1, c2]} style={styles.gridAvatar}>
          {item.avatar_url
            ? <Image source={{ uri: item.avatar_url }} style={styles.gridAvatarImg} />
            : <Text style={styles.gridAvatarText}>{initials}</Text>
          }
        </LinearGradient>
        <Text style={styles.gridName} numberOfLines={1}>{item.full_name || item.username}</Text>
        <Text style={styles.gridCity} numberOfLines={1}>{item.current_city || 'City'}</Text>
        <Text style={[styles.gridDist, { color: Colors.saffron }]}>📍 {(item.distance_km || 0).toFixed(1)} km</Text>

        <View style={styles.tagsContainer}>
           {item.interests?.slice(0, 2).map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
           ))}
        </View>

        <TouchableOpacity
           style={[styles.connectBtn, isConnected && styles.connectedBtn]}
           onPress={() => !isConnected && connectWithUser(item.id)}
           disabled={isConnected}
        >
           {isConnected ? (
             <><Check size={12} color={Colors.background} /><Text style={styles.connectedText}> Connected</Text></>
           ) : (
             <><UserPlus size={12} color="#fff" /><Text style={styles.connectBtnText}> Connect</Text></>
           )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
         data={nearbyUsers}
         renderItem={renderGridItem}
         keyExtractor={item => item.id}
         ListHeaderComponent={renderHeader}
         numColumns={2}
         columnWrapperStyle={styles.gridRow}
         contentContainerStyle={styles.scrollContent}
         showsVerticalScrollIndicator={false}
         ListEmptyComponent={
           !loading ? (
             <View style={styles.emptyState}>
               <Text style={styles.emptyText}>No users found within {Math.round(radiusKm)}km</Text>
             </View>
           ) : null
         }
      />
      {loading && nearbyUsers.length === 0 && (
         <View style={styles.floatingLoader}>
            <ActivityIndicator color={Colors.saffron} size="large" />
         </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerContainer: { width: '100%', marginBottom: 8 },

  // Stats Row — 3 cards in a row
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  statCardHighlight: { borderColor: 'rgba(232,137,42,0.25)', backgroundColor: 'rgba(232,137,42,0.04)' },
  statCardAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    backgroundColor: Colors.saffron },
  statNum: { fontFamily: Typography.display, fontSize: 26, color: Colors.text, lineHeight: 30 },
  statNumSaffron: { color: Colors.saffron },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 4, letterSpacing: 0.4,
    textTransform: 'uppercase', fontFamily: Typography.bodyBold },

  // Section titles with trailing rule line
  secTitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  secTitle: { fontSize: 10, fontFamily: Typography.bodyBold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.2, marginRight: 8 },
  secTitleLine: { flex: 1, height: 1, backgroundColor: Colors.border },

  mapWrapper: { height: 185, width: width - 32, position: 'relative', marginBottom: 10,
    borderRadius: 18, overflow: 'hidden', marginHorizontal: 16 },
  map: { ...StyleSheet.absoluteFillObject },
  mapLoading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2 },

  pinContainer: { alignItems: 'center', justifyContent: 'center' },
  pinAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.saffron, backgroundColor: Colors.surface },
  pinArrow: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: Colors.saffron, marginTop: -1 },

  previewCard: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(20,21,24,0.95)', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  previewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 15, fontFamily: Typography.bodyBold, color: Colors.text },
  previewMeta: { fontSize: 12, fontFamily: Typography.body, color: Colors.textSecondary },
  previewDistRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  previewDistText: { fontSize: 11, fontFamily: Typography.bodyBold, color: Colors.tealLight },
  previewClose: { padding: 8 },
  previewCloseText: { fontSize: 16, color: Colors.textSecondary },

  sliderSection: { paddingHorizontal: 16, backgroundColor: Colors.surface, marginHorizontal: 16,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 10, marginBottom: 20 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderLabel: { fontSize: 11, fontFamily: Typography.bodySemiBold, color: Colors.textSecondary },
  sliderValue: { fontFamily: Typography.display, fontSize: 15, color: Colors.saffron },
  slider: { width: '100%', height: 36 },

  gridTitle: { fontSize: 10, fontFamily: Typography.bodyBold, color: Colors.textTertiary,
    paddingHorizontal: 16, marginTop: 4, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.2 },
  scrollContent: { paddingBottom: 100 },
  gridRow: { paddingHorizontal: 16, justifyContent: 'space-between', marginBottom: 10 },

  gridCard: { width: (width - 48) / 2, backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  gridCardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 42,
    backgroundColor: 'rgba(232,137,42,0.035)' },
  gridAvatar: { width: 46, height: 46, borderRadius: 23, marginBottom: 10, alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)' } as any,
  gridAvatarImg: { width: 46, height: 46, borderRadius: 23 },
  gridAvatarText: { fontSize: 15, fontFamily: Typography.bodyBold, color: '#fff' },
  gridName: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.text, marginBottom: 2, textAlign: 'center' },
  gridCity: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2, textAlign: 'center' },
  gridDist: { fontSize: 11, fontFamily: Typography.bodyBold, marginBottom: 8, textAlign: 'center' },

  gridDistRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  gridDistText: { fontSize: 11, fontFamily: Typography.body, color: Colors.textSecondary },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginBottom: 12, minHeight: 22 },
  tag: { backgroundColor: Colors.surface3, borderWidth: 1, borderColor: Colors.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 10, fontFamily: Typography.bodySemiBold, color: Colors.textSecondary },

  connectBtn: { backgroundColor: Colors.saffron, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', height: 34, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  connectedBtn: { backgroundColor: 'rgba(26,174,163,0.12)', borderColor: 'rgba(26,174,163,0.35)' },
  connectBtnText: { fontSize: 12, fontFamily: Typography.bodyBold, color: '#fff' },
  connectedText: { fontSize: 12, fontFamily: Typography.bodyBold, color: Colors.tealLight },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: Typography.bodyBold, color: Colors.text },

  floatingLoader: { position: 'absolute', top: '50%', left: '50%', marginLeft: -18, marginTop: -18, backgroundColor: Colors.surface, padding: 16, borderRadius: 24 },

  directoryWidget: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 16, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  directoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  directoryEmoji: { fontSize: 30 },
  directoryTitle: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.text, marginBottom: 2 },
  directorySub: { fontSize: 11, fontFamily: Typography.body, color: Colors.textSecondary },
  directoryArrow: { fontSize: 26, color: Colors.saffron },

  // Legacy refs kept for old statsBar-style (now replaced)
  statsBar: { flexDirection: 'row' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: Typography.display, color: Colors.text },
  statDivider: { width: 1, height: 24, backgroundColor: Colors.border },
});


