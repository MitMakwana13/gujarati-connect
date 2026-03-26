import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save } from 'lucide-react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Initialize form
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    hometown: profile?.hometown || '',
    languages: Array.isArray(profile?.languages) ? profile.languages.join(', ') : (profile?.languages || ''),
    community: profile?.community || '',
    current_city: profile?.current_city || '',
    industry: profile?.industry || '',
    role: profile?.role || '',
    education: profile?.education || '',
    interests: Array.isArray(profile?.interests) ? profile.interests.join(', ') : (profile?.interests || ''),
  });

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const languagesArray = formData.languages.split(',').map(s => s.trim()).filter(Boolean);
      const interestsArray = formData.interests.split(',').map(s => s.trim()).filter(Boolean);

      const updates = {
         full_name: formData.full_name,
         username: formData.username,
         bio: formData.bio,
         hometown: formData.hometown,
         languages: languagesArray,
         community: formData.community,
         current_city: formData.current_city,
         industry: formData.industry,
         role: formData.role,
         education: formData.education,
         interests: interestsArray,
         updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;

      await refreshProfile();
      router.back();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const InputRow = ({ label, field, multiline = false }: { label: string, field: keyof typeof formData, multiline?: boolean }) => (
    <View style={styles.inputGroup}>
       <Text style={styles.label}>{label}</Text>
       <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={formData[field]}
          onChangeText={(val) => updateField(field, val)}
          placeholderTextColor={Colors.textSecondary}
          placeholder={`Enter ${label.toLowerCase()}`}
          multiline={multiline}
       />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
               <ArrowLeft color={Colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
               {loading ? <ActivityIndicator color={Colors.saffron} /> : <Save color={Colors.saffron} size={20} />}
            </TouchableOpacity>
         </View>

         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Basic Info</Text>
               <InputRow label="Full Name" field="full_name" />
               <InputRow label="Username" field="username" />
               <InputRow label="Bio" field="bio" multiline />
            </View>

            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Origin & Identity</Text>
               <InputRow label="Hometown" field="hometown" />
               <InputRow label="Current City" field="current_city" />
               <InputRow label="Languages (comma separated)" field="languages" />
               <InputRow label="Community (Optional)" field="community" />
            </View>

            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Professional</Text>
               <InputRow label="Industry" field="industry" />
               <InputRow label="Role / Title" field="role" />
               <InputRow label="Education" field="education" />
            </View>

            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Skills & Interests</Text>
               <InputRow label="Interests (comma separated)" field="interests" />
            </View>
            
            <View style={{ height: 40 }} />
         </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { padding: 4 },
  saveBtn: { padding: 4 },
  title: { fontSize: 18, fontFamily: Typography.display, color: Colors.text },
  
  scrollContent: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.saffron, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: Colors.text, fontFamily: Typography.body, fontSize: 15 },
  inputMultiline: { minHeight: 100, textAlignVertical: 'top' }
});
