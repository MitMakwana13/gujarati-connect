import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, Image as ImageIcon, MapPin, Send } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export default function ComposeScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const MAX_CHARS = 500;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      const ext = uri.substring(uri.lastIndexOf('.') + 1);
      const filePath = `${user?.id}/${Date.now()}.${ext}`;
      
      const { data, error } = await supabase.storage.from('posts').upload(filePath, decode(base64), { 
         contentType: `image/${ext}` 
      });
      
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filePath);
      return publicUrl;
    } catch (e) {
      console.error('Upload Error:', e);
      return null;
    }
  };

  const extractHashtags = (text: string) => {
    const regex = /#[\w\u0590-\u05ff]+/g;
    const matches = text.match(regex);
    return matches ? matches.map(m => m.slice(1).toLowerCase()) : [];
  };

  const handlePost = async () => {
    if ((!content.trim() && !image) || !user) return;
    setLoading(true);

    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      const hashtags = extractHashtags(content);

      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
        hashtags: hashtags,
        city: profile?.current_city || null,
      });

      if (error) throw error;
      router.back();
    } catch (e: any) {
      alert('Error creating post: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
               <X color={Colors.text} size={28} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.postBtn, (!content.trim() && !image) && styles.postBtnDisabled]} onPress={handlePost} disabled={(!content.trim() && !image) || loading}>
               {loading ? <ActivityIndicator color={Colors.surface} size="small" /> : <Text style={styles.postBtnText}>Post</Text>}
            </TouchableOpacity>
         </View>

         <ScrollView style={styles.contentArea} keyboardShouldPersistTaps="handled">
            <View style={styles.authorRow}>
               <Image source={{ uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }} style={styles.avatar} />
               <View>
                  <Text style={styles.authorName}>{profile?.full_name || profile?.username}</Text>
                  <Text style={styles.authorMeta}>@{profile?.username} • {profile?.current_city}</Text>
               </View>
            </View>

            <TextInput
               style={styles.input}
               placeholder="What's happening in your community?"
               placeholderTextColor={Colors.textSecondary}
               value={content}
               onChangeText={setContent}
               multiline
               autoFocus
               maxLength={MAX_CHARS}
            />

            {image && (
               <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
                     <X color="#fff" size={20} />
                  </TouchableOpacity>
               </View>
            )}
         </ScrollView>

         <View style={styles.toolbarArea}>
            <View style={styles.toolbarActions}>
               <TouchableOpacity style={styles.toolbarIcon} onPress={pickImage}>
                  <ImageIcon size={24} color={Colors.saffron} />
               </TouchableOpacity>
               <TouchableOpacity style={styles.toolbarIcon}>
                  <MapPin size={24} color={Colors.teal} />
               </TouchableOpacity>
            </View>
            <Text style={[styles.charCount, content.length > MAX_CHARS - 20 && { color: '#ef4444' }]}>
               {content.length}/{MAX_CHARS}
            </Text>
         </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { padding: 4 },
  postBtn: { backgroundColor: Colors.saffron, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnDisabled: { backgroundColor: Colors.surface2 },
  postBtnText: { color: '#fff', fontFamily: Typography.bodyBold, fontSize: 16 },

  contentArea: { flex: 1, padding: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  authorName: { fontSize: 16, fontFamily: Typography.bodyBold, color: Colors.text, marginBottom: 2 },
  authorMeta: { fontSize: 13, fontFamily: Typography.body, color: Colors.textSecondary },

  input: { fontSize: 18, fontFamily: Typography.body, color: Colors.text, lineHeight: 26, minHeight: 120, textAlignVertical: 'top', marginBottom: 20 },
  
  imagePreviewContainer: { position: 'relative', marginBottom: 20 },
  imagePreview: { width: '100%', height: 300, borderRadius: 16 },
  removeImageBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  toolbarArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  toolbarActions: { flexDirection: 'row', gap: 20 },
  toolbarIcon: { padding: 4 },
  charCount: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.textSecondary },
});
