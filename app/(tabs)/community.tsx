import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, MapPin as MapPinIcon, Heart, MessageCircle, Share2, X, Send } from 'lucide-react-native';

const POSTS_PER_PAGE = 10;

export default function CommunityScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Comments Sheet State
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useFocusEffect(
    useCallback(() => {
       fetchInitialData();
    }, [activeTag]) // Refetch when active tag changes
  );

  const fetchInitialData = async () => {
    setLoading(true);
    setPage(0);
    setHasMore(true);
    await Promise.all([fetchPosts(0, true), fetchTrendingTags()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    await Promise.all([fetchPosts(0, true), fetchTrendingTags()]);
    setRefreshing(false);
  };

  const fetchPosts = async (pageNumber: number, overwrite = false) => {
    try {
      let query = supabase
         .from('posts')
         .select(`*, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url, current_city), post_likes(user_id)`)
         .order('created_at', { ascending: false })
         .range(pageNumber * POSTS_PER_PAGE, (pageNumber + 1) * POSTS_PER_PAGE - 1);
         
      if (activeTag) {
         query = query.contains('hashtags', [activeTag]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // map likes dynamically
      const mapped = (data || []).map(p => ({
         ...p,
         isLiked: p.post_likes.some((link: any) => link.user_id === user?.id)
      }));

      if (mapped.length < POSTS_PER_PAGE) setHasMore(false);

      if (overwrite) setPosts(mapped);
      else setPosts(prev => [...prev, ...mapped]);

    } catch (e) {
      console.error(e);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || loading || refreshing) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchPosts(nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const fetchTrendingTags = async () => {
     try {
        // Fetch 50 most recent posts to extract trending tags
        const { data } = await supabase.from('posts').select('hashtags').order('created_at', { ascending: false }).limit(50);
        if (!data) return;
        
        const counts: Record<string, number> = {};
        data.forEach(p => {
           (p.hashtags || []).forEach((t: string) => {
              counts[t] = (counts[t] || 0) + 1;
           });
        });

        const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).map(e => e[0]).slice(0, 10);
        setTrendingTags(sorted);
     } catch (e) {}
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean, currentCount: number) => {
     if (!user) return;
     // Opt UI update
     setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: !currentlyLiked, likes_count: currentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1 } : p));
     
     try {
        if (currentlyLiked) {
           await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id });
        } else {
           await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        }
     } catch(e) {
        // Revert on error
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: currentlyLiked, likes_count: currentCount } : p));
     }
  };

  // Comments Logic
  const openComments = async (postId: string) => {
     setActivePostId(postId);
     setComments([]);
     const { data } = await supabase.from('comments').select('*, author:profiles!comments_author_id_fkey(id, full_name, username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true });
     if (data) setComments(data);
  };

  const submitComment = async () => {
     if (!commentInput.trim() || !user || !activePostId) return;
     setSendingComment(true);
     const content = commentInput.trim();
     try {
        const { data } = await supabase.from('comments').insert({ post_id: activePostId, author_id: user.id, content }).select('*, author:profiles!comments_author_id_fkey(id, full_name, username, avatar_url)').single();
        if (data) {
           setComments(prev => [...prev, data]);
           setCommentInput('');
           // updating post count in UI
           setPosts(prev => prev.map(p => p.id === activePostId ? { ...p, comments_count: p.comments_count + 1 } : p));
        }
     } catch (e) {} finally {
        setSendingComment(false);
     }
  };

  const timeAgo = (dateStr: string) => {
     const date = new Date(dateStr);
     const secs = Math.floor((new Date().getTime() - date.getTime()) / 1000);
     if (secs < 60) return `${secs}s`;
     if (secs < 3600) return `${Math.floor(secs/60)}m`;
     if (secs < 86400) return `${Math.floor(secs/3600)}h`;
     return `${Math.floor(secs/86400)}d`;
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
       <View style={styles.postHeader}>
          <View style={styles.postAvatarWrap}>
            {item.author?.avatar_url
              ? <Image source={{ uri: item.author.avatar_url }} style={styles.postAvatar} />
              : <View style={[styles.postAvatar, styles.postAvatarFallback]}>
                  <Text style={styles.postAvatarText}>{(item.author?.full_name || item.author?.username || '?').charAt(0).toUpperCase()}</Text>
                </View>
            }
          </View>
          <View style={styles.postHeaderInfo}>
             <Text style={styles.postAuthorName}>{item.author?.full_name || item.author?.username}</Text>
             <Text style={styles.postTimeMeta}>🌍 {item.author?.current_city || 'Worldwide'}</Text>
          </View>
          <Text style={styles.postTime}>{timeAgo(item.created_at)}</Text>
       </View>

       <Text style={styles.postContent}>{item.content}</Text>

       {item.image_url && (
          <View style={styles.postImageWrap}>
            <Image source={{ uri: item.image_url }} style={styles.postImage} resizeMode="cover" />
          </View>
       )}

       {item.hashtags && item.hashtags.length > 0 && (
          <View style={styles.hashRow}>
             {item.hashtags.map((h: string, idx: number) => (
                <Text key={idx} style={styles.hashText}>#{h}</Text>
             ))}
          </View>
       )}

       <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item.id, item.isLiked, item.likes_count)}>
             <Text style={styles.actionEmoji}>{item.isLiked ? '❤️' : '🤍'}</Text>
             <Text style={[styles.actionText, item.isLiked && { color: Colors.saffron }]}>{item.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item.id)}>
             <Text style={styles.actionEmoji}>💬</Text>
             <Text style={styles.actionText}>{item.comments_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
             <Text style={styles.actionEmoji}>🔁</Text>
             <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
       </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <Text style={styles.title}>Community</Text>
      </View>

      {/* Main List */}
      <FlatList
         data={posts}
         renderItem={renderPost}
         keyExtractor={item => item.id}
         contentContainerStyle={styles.listContent}
         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.saffron} />}
         onEndReached={loadMore}
         onEndReachedThreshold={0.5}
         ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.saffron} style={{ margin: 20 }} /> : null}
         ListEmptyComponent={loading ? <ActivityIndicator color={Colors.saffron} style={{ marginTop: 40 }} /> : <Text style={styles.emptyText}>No posts yet.</Text>}
         ListHeaderComponent={(
            <View style={styles.feedTopSection}>
               {/* Composer Bar */}
               <TouchableOpacity style={styles.composerBar} onPress={() => router.push('/compose' as any)}>
                  <Image source={{ uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }} style={styles.composeAvatar} />
                  <View style={styles.composeInputDummy}>
                     <Text style={styles.composePlaceholder}>Share something with the community...</Text>
                  </View>
                  <View style={styles.composeActions}>
                     <Camera size={20} color={Colors.textSecondary} style={{ marginRight: 12 }} />
                     <MapPinIcon size={20} color={Colors.textSecondary} />
                  </View>
               </TouchableOpacity>

               {/* Trending Hashtags */}
               {trendingTags.length > 0 && (
                  <View style={styles.trendingContainer}>
                     <Text style={styles.trendingTitle}>Trending</Text>
                     <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={trendingTags}
                        keyExtractor={item => item}
                        renderItem={({item}) => (
                           <TouchableOpacity 
                              style={[styles.tagChip, activeTag === item && styles.tagChipActive]}
                              onPress={() => setActiveTag(activeTag === item ? null : item)}
                           >
                              <Text style={[styles.tagChipText, activeTag === item && styles.tagChipTextActive]}>#{item}</Text>
                           </TouchableOpacity>
                        )}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                     />
                  </View>
               )}
            </View>
         )}
      />

      {/* Comments Bottom Modal Sheet */}
      <Modal visible={!!activePostId} animationType="slide" transparent={true} onRequestClose={() => setActivePostId(null)}>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Comments</Text>
                  <TouchableOpacity onPress={() => setActivePostId(null)} style={styles.closeBtn}>
                     <X color={Colors.text} size={24} />
                  </TouchableOpacity>
               </View>

               <FlatList
                  data={comments}
                  keyExtractor={c => c.id}
                  renderItem={({item}) => {
                     const auth = Array.isArray(item.author) ? item.author[0] : item.author;
                     return (
                     <View style={styles.commentRow}>
                        <Image source={{ uri: auth?.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }} style={styles.commentAvatar} />
                        <View style={styles.commentBubble}>
                           <Text style={styles.commentName}>{auth?.full_name || auth?.username}</Text>
                           <Text style={styles.commentText}>{item.content}</Text>
                        </View>
                     </View>
                  )}}
                  contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                  ListEmptyComponent={<Text style={styles.emptyComments}>No comments yet. Start the conversation!</Text>}
               />

               <View style={styles.commentInputArea}>
                  <TextInput
                     style={styles.commentInput}
                     placeholder="Write a comment..."
                     placeholderTextColor={Colors.textSecondary}
                     value={commentInput}
                     onChangeText={setCommentInput}
                     multiline
                  />
                  <TouchableOpacity style={styles.sendBtn} onPress={submitComment} disabled={!commentInput.trim() || sendingComment}>
                     {sendingComment ? <ActivityIndicator size="small" color={Colors.saffron} /> : <Send size={20} color={commentInput.trim() ? Colors.saffron : Colors.textSecondary} />}
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
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, backgroundColor: Colors.background },
  title: { fontSize: 28, fontFamily: Typography.display, color: Colors.text },

  listContent: { paddingBottom: 40 },
  feedTopSection: { marginBottom: 4 },

  // Section title with trailing rule line (matches reference)
  secTitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  secTitle: { fontSize: 10, fontFamily: Typography.bodyBold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.2, marginRight: 8 },
  secTitleLine: { flex: 1, height: 1, backgroundColor: Colors.border },

  // Composer bar — flat reference style
  composerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 14,
    marginHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  composeAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: 12,
    backgroundColor: Colors.saffronDark, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  composeAvatarText: { fontFamily: Typography.bodyBold, fontSize: 14, color: '#fff' },
  composeInputDummy: { flex: 1 },
  composePlaceholder: { fontSize: 13, fontFamily: Typography.body, color: Colors.textTertiary },
  composeActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  composeAction: { width: 32, height: 32, backgroundColor: Colors.surface3, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center' },

  // Trending chips with saffron # prefix
  trendingContainer: { marginBottom: 10 },
  trendingTitle: { fontSize: 10, fontFamily: Typography.bodyBold, color: Colors.textTertiary,
    marginLeft: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.2 },
  tagChip: { flexDirection: 'row', backgroundColor: Colors.surface, paddingHorizontal: 13, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  tagChipActive: { backgroundColor: 'rgba(232,137,42,0.08)', borderColor: 'rgba(232,137,42,0.35)' },
  tagHash: { color: Colors.saffron, fontFamily: Typography.bodyBold, fontSize: 11, marginRight: 1 },
  tagChipText: { color: Colors.textSecondary, fontFamily: Typography.bodySemiBold, fontSize: 11 },
  tagChipTextActive: { color: Colors.saffronLight },

  // Post cards — reference spec
  postCard: { backgroundColor: Colors.surface, padding: 16, marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postAvatarWrap: { marginRight: 10 },
  postAvatar: { width: 38, height: 38, borderRadius: 19 },
  postAvatarFallback: { backgroundColor: Colors.saffronDark, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { fontFamily: Typography.bodyBold, fontSize: 13, color: '#fff' },
  postHeaderInfo: { flex: 1 },
  postAuthorName: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.text },
  postTimeMeta: { fontSize: 11, color: Colors.textSecondary, fontFamily: Typography.body },
  postTime: { fontSize: 11, color: Colors.textTertiary, fontFamily: Typography.body },

  postContent: { fontSize: 13, fontFamily: Typography.body, color: Colors.text, lineHeight: 21, marginBottom: 12 },
  postImageWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  postImage: { width: '100%', height: 160, borderRadius: 12 },

  hashRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
  hashText: { color: Colors.saffron, fontFamily: Typography.body, fontSize: 12 },

  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  actionEmoji: { fontSize: 13 },
  actionText: { fontSize: 12, fontFamily: Typography.bodySemiBold, color: Colors.textSecondary },

  emptyText: { textAlign: 'center', color: Colors.textSecondary, fontFamily: Typography.body, marginTop: 40 },

  // Modal / Comments
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.text },
  closeBtn: { padding: 4 },
  commentRow: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  commentBubble: { flex: 1, backgroundColor: Colors.surface, padding: 12, borderRadius: 16, borderTopLeftRadius: 4 },
  commentName: { fontSize: 14, fontFamily: Typography.bodyBold, color: Colors.text, marginBottom: 4 },
  commentText: { fontSize: 14, fontFamily: Typography.body, color: Colors.textSecondary, lineHeight: 20 },
  emptyComments: { textAlign: 'center', color: Colors.textSecondary, fontFamily: Typography.body, fontStyle: 'italic', marginTop: 40 },
  commentInputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  commentInput: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, paddingTop: 12, color: Colors.text, fontFamily: Typography.body, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
});
