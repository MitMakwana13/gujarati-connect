import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Linking, TextInput, Modal, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MapPin, Phone, Globe, CheckCircle, Star, Send, X } from 'lucide-react-native';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [biz, setBiz] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [myReview, setMyReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [showReview, setShowReview] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (id) fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: bizData }, { data: revData }] = await Promise.all([
        supabase.from('businesses').select('*, owner:profiles!businesses_owner_id_fkey(full_name, username, avatar_url)').eq('id', id).single(),
        supabase.from('business_reviews').select('*, reviewer:profiles!business_reviews_reviewer_id_fkey(full_name, username, avatar_url)').eq('business_id', id).order('created_at', { ascending: false }),
      ]);
      setBiz(bizData);
      setReviews(revData || []);
      if (user) setMyReview((revData || []).find((r: any) => r.reviewer_id === user.id) || null);
    } catch (e) {} finally { setLoading(false); }
  };

  const submitReview = async () => {
    if (!user || !reviewText.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('business_reviews').upsert({
        business_id: id,
        reviewer_id: user.id,
        rating: reviewRating,
        review_text: reviewText.trim(),
      });
      setShowReview(false);
      setReviewText('');
      await fetchData();
    } catch (e) {} finally { setSubmitting(false); }
  };

  const renderStars = (n: number, interactive = false) => (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} disabled={!interactive} onPress={() => interactive && setReviewRating(i)}>
          <Text style={{ fontSize: interactive ? 28 : 14, color: i <= n ? Colors.saffron : Colors.border }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator color={Colors.saffron} style={{ marginTop: 80 }} /></SafeAreaView>;
  if (!biz) return <SafeAreaView style={styles.container}><Text style={styles.notFound}>Business not found.</Text></SafeAreaView>;

  const owner = Array.isArray(biz.owner) ? biz.owner[0] : biz.owner;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.heroEmoji}>{biz.logo_emoji || '🏢'}</Text>
        </View>

        <View style={styles.body}>
          {/* Name + verified */}
          <View style={styles.nameRow}>
            <Text style={styles.bizName}>{biz.name}</Text>
            {biz.is_verified && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={14} color={Colors.teal} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.bizType}>{biz.type}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {renderStars(Math.round(biz.rating || 0))}
            <Text style={styles.ratingNum}>{Number(biz.rating || 0).toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({biz.review_count} reviews)</Text>
          </View>

          {/* Description */}
          {biz.description ? <Text style={styles.description}>{biz.description}</Text> : null}

          {/* Info cards */}
          <View style={styles.infoGrid}>
            {biz.city || biz.address ? (
              <View style={styles.infoRow}>
                <MapPin size={18} color={Colors.saffron} style={{ marginRight: 10 }} />
                <Text style={styles.infoText}>{biz.address || biz.city}{biz.country ? `, ${biz.country}` : ''}</Text>
              </View>
            ) : null}
            {biz.phone ? (
              <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${biz.phone}`)}>
                <Phone size={18} color={Colors.tealLight} style={{ marginRight: 10 }} />
                <Text style={[styles.infoText, { color: Colors.tealLight }]}>{biz.phone}</Text>
              </TouchableOpacity>
            ) : null}
            {biz.website ? (
              <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(biz.website)}>
                <Globe size={18} color={Colors.saffron} style={{ marginRight: 10 }} />
                <Text style={[styles.infoText, { color: Colors.saffron }]} numberOfLines={1}>{biz.website}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Owner */}
          {owner && (
            <View style={styles.ownerCard}>
              <Image source={{ uri: owner.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }} style={styles.ownerAvatar} />
              <View>
                <Text style={styles.ownerLabel}>Business Owner</Text>
                <Text style={styles.ownerName}>{owner.full_name || owner.username}</Text>
              </View>
            </View>
          )}

          {/* Write a Review Button */}
          <TouchableOpacity style={styles.writeReviewBtn} onPress={() => { setReviewRating(myReview?.rating || 5); setReviewText(myReview?.review_text || ''); setShowReview(true); }}>
            <Star size={18} color={Colors.saffron} style={{ marginRight: 8 }} />
            <Text style={styles.writeReviewText}>{myReview ? 'Edit Your Review' : 'Write a Review'}</Text>
          </TouchableOpacity>

          {/* Reviews */}
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
          ) : (
            reviews.map((rev: any) => {
              const reviewer = Array.isArray(rev.reviewer) ? rev.reviewer[0] : rev.reviewer;
              return (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image source={{ uri: reviewer?.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }} style={styles.reviewAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewerName}>{reviewer?.full_name || reviewer?.username}</Text>
                      {renderStars(rev.rating)}
                    </View>
                    <Text style={styles.reviewDate}>{new Date(rev.created_at).toLocaleDateString()}</Text>
                  </View>
                  {rev.review_text ? <Text style={styles.reviewText}>{rev.review_text}</Text> : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={showReview} animationType="slide" transparent onRequestClose={() => setShowReview(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{myReview ? 'Edit Review' : 'Write a Review'}</Text>
              <TouchableOpacity onPress={() => setShowReview(false)}><X color={Colors.text} size={24} /></TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={styles.label}>Your Rating</Text>
              {renderStars(reviewRating, true)}
              <Text style={[styles.label, { marginTop: 20 }]}>Your Review</Text>
              <TextInput
                style={styles.reviewInput}
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Share your experience..."
                placeholderTextColor={Colors.textSecondary}
                multiline
              />
              <TouchableOpacity style={styles.submitBtn} onPress={submitReview} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <><Send size={18} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.submitText}>Submit Review</Text></>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: { color: Colors.textSecondary, textAlign: 'center', marginTop: 60, fontFamily: Typography.body, fontSize: 16 },
  hero: { height: 180, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8 },
  heroEmoji: { fontSize: 72 },
  body: { padding: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4, gap: 8 },
  bizName: { fontSize: 24, fontFamily: Typography.display, color: Colors.text, flexShrink: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(19,138,128,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  verifiedText: { fontSize: 11, fontFamily: Typography.bodyBold, color: Colors.teal },
  bizType: { fontSize: 14, fontFamily: Typography.body, color: Colors.saffron, marginBottom: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  ratingNum: { fontSize: 16, fontFamily: Typography.display, color: Colors.text },
  ratingCount: { fontSize: 13, fontFamily: Typography.body, color: Colors.textSecondary },
  description: { fontSize: 15, fontFamily: Typography.body, color: Colors.textSecondary, lineHeight: 24, marginBottom: 20 },
  infoGrid: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 14, fontFamily: Typography.body, color: Colors.text, flex: 1 },
  ownerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  ownerAvatar: { width: 44, height: 44, borderRadius: 22 },
  ownerLabel: { fontSize: 11, fontFamily: Typography.bodyBold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  ownerName: { fontSize: 15, fontFamily: Typography.bodyBold, color: Colors.text },
  writeReviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,137,42,0.1)', borderWidth: 1, borderColor: Colors.saffron, borderRadius: 20, paddingVertical: 14, marginBottom: 24 },
  writeReviewText: { fontSize: 15, fontFamily: Typography.bodyBold, color: Colors.saffron },
  sectionTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.text, marginBottom: 14 },
  noReviews: { fontSize: 14, fontFamily: Typography.body, color: Colors.textSecondary, fontStyle: 'italic' },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewerName: { fontSize: 14, fontFamily: Typography.bodyBold, color: Colors.text, marginBottom: 2 },
  reviewDate: { fontSize: 11, fontFamily: Typography.body, color: Colors.textSecondary },
  reviewText: { fontSize: 14, fontFamily: Typography.body, color: Colors.textSecondary, lineHeight: 20 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.text },
  label: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  reviewInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, color: Colors.text, fontFamily: Typography.body, fontSize: 15, minHeight: 100, textAlignVertical: 'top', marginBottom: 20 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.saffron, borderRadius: 20, paddingVertical: 14 },
  submitText: { fontSize: 15, fontFamily: Typography.bodyBold, color: '#fff' },
});
