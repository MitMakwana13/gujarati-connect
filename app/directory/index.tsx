import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView,
  TextInput, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Star, MapPin, CheckCircle } from 'lucide-react-native';
import { ArrowLeft } from 'lucide-react-native';

const TYPES = ['All', 'Diamond & Jewelry', 'Restaurant', 'Technology', 'Real Estate', 'Finance', 'Retail', 'Education', 'Healthcare', 'Other'];

export default function DirectoryScreen() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('All');

  useFocusEffect(useCallback(() => { fetchBusinesses(); }, [activeType]));

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      let q = supabase.from('businesses').select('*').order('is_verified', { ascending: false }).order('rating', { ascending: false });
      if (activeType !== 'All') q = q.eq('type', activeType);
      const { data } = await q;
      setBusinesses(data || []);
    } catch (e) {} finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchBusinesses(); setRefreshing(false); };

  const filtered = search.trim()
    ? businesses.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        (b.city || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.type || '').toLowerCase().includes(search.toLowerCase())
      )
    : businesses;

  const renderStars = (rating: number) => {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/directory/[id]' as any, params: { id: item.id } })}
    >
      <View style={styles.cardLeft}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>{item.logo_emoji || '🏢'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.bizName} numberOfLines={1}>{item.name}</Text>
            {item.is_verified && <CheckCircle size={14} color={Colors.teal} style={{ marginLeft: 4 }} />}
          </View>
          <Text style={styles.bizType}>{item.type}</Text>
          {item.city ? (
            <View style={styles.locationRow}>
              <MapPin size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>{item.city}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.ratingCol}>
        <Text style={styles.stars}>{renderStars(item.rating || 0)}</Text>
        <Text style={styles.ratingVal}>{Number(item.rating || 0).toFixed(1)}</Text>
        <Text style={styles.reviewCount}>{item.review_count} reviews</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Business Directory</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/directory/create' as any)}
        >
          <Plus size={22} color={Colors.saffron} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Search size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search businesses, cities..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Type filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TYPES}
        keyExtractor={t => t}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, activeType === item && styles.chipActive]}
            onPress={() => setActiveType(item)}
          >
            <Text style={[styles.chipText, activeType === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.chipRow}
        style={{ flexGrow: 0 }}
      />

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.saffron} />}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color={Colors.saffron} style={{ marginTop: 40 }} />
            : <View style={styles.empty}><Text style={styles.emptyTitle}>No businesses found</Text><Text style={styles.emptySub}>Be the first to list yours!</Text></View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  addBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: Typography.display, color: Colors.text },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, marginHorizontal: 20, marginVertical: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.text, fontFamily: Typography.body, fontSize: 15 },

  chipRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive: { backgroundColor: 'rgba(232,137,42,0.15)', borderColor: Colors.saffron },
  chipText: { color: Colors.textSecondary, fontFamily: Typography.bodyBold, fontSize: 12 },
  chipTextActive: { color: Colors.saffron },

  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  logoBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  logoEmoji: { fontSize: 26 },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  bizName: { fontSize: 15, fontFamily: Typography.bodyBold, color: Colors.text, flexShrink: 1 },
  bizType: { fontSize: 12, fontFamily: Typography.body, color: Colors.saffron, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, fontFamily: Typography.body, color: Colors.textSecondary },

  ratingCol: { alignItems: 'flex-end' },
  stars: { color: Colors.saffron, fontSize: 10, letterSpacing: 1 },
  ratingVal: { fontSize: 16, fontFamily: Typography.display, color: Colors.text },
  reviewCount: { fontSize: 10, fontFamily: Typography.body, color: Colors.textSecondary },

  empty: { padding: 40, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: Typography.body, color: Colors.textSecondary },
});
