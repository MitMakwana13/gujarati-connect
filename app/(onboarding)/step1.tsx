import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { User, AtSign, ArrowRight, Camera } from 'lucide-react-native';

export default function OnboardingStep1() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!fullName || !username) {
      alert('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, username: username.toLowerCase().replace(/[^a-z0-9_]/g, '') })
        .eq('id', user?.id);

      if (error) throw error;
      
      await refreshProfile();
      router.push('/(onboarding)/step2');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.header}>
          <Text style={styles.stepText}>Step 1 of 3</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Tell us about you</Text>
          <Text style={styles.subtitle}>Set up your personal identity on the Global Gujarati Network.</Text>

          <View style={styles.form}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarPlaceholder}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200' }} style={styles.avatarImage} />
                <TouchableOpacity style={styles.cameraBtn}>
                  <Camera color="#fff" size={16} />
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarLabel}>Upload Photo</Text>
            </View>

            <View style={styles.inputGroup}>
              <User color={Colors.textSecondary} size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.textSecondary}
                value={fullName}
                onChangeText={setFullName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <AtSign color={Colors.textSecondary} size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={Colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>CONTINUE</Text>
                  <ArrowRight color="#fff" size={20} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  stepText: { color: Colors.saffron, fontFamily: Typography.bodyBold, fontSize: 13, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  progressBar: { height: 4, backgroundColor: Colors.surface2, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: Colors.saffron, borderRadius: 2 },
  
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 36, fontFamily: Typography.display, color: Colors.text, marginBottom: 12 },
  subtitle: { fontSize: 16, fontFamily: Typography.body, color: Colors.textSecondary, marginBottom: 40, lineHeight: 24 },
  
  form: { gap: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, position: 'relative' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, backgroundColor: Colors.saffron, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background },
  avatarLabel: { color: Colors.textSecondary, fontFamily: Typography.body, fontSize: 13, marginTop: 12 },
  
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.border, height: 56 },
  icon: { marginRight: 12 },
  input: { flex: 1, color: Colors.text, fontFamily: Typography.body, fontSize: 16, height: '100%' },
  
  submitBtn: { backgroundColor: Colors.saffron, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  submitBtnText: { fontSize: 14, fontFamily: Typography.bodyBold, color: '#fff', letterSpacing: 1 }
});
