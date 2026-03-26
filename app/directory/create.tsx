import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react-native';

const TYPES = ['Diamond & Jewelry', 'Restaurant', 'Technology', 'Real Estate', 'Finance', 'Retail', 'Education', 'Healthcare', 'Other'];
const EMOJIS = ['🏢', '💎', '🍽️', '💻', '🏠', '💰', '🛍️', '🎓', '🏥', '⚡'];

export default function CreateBusinessScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [description, setDescription] = useState('');
  const [logoEmoji, setLogoEmoji] = useState('🏢');
  const [city, setCity] = useState(profile?.current_city || '');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('businesses').insert({
        owner_id: user.id,
        name: name.trim(),
        type,
        description: description.trim(),
        logo_emoji: logoEmoji,
        city: city.trim() || null,
        country: country.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
      });
      if (error) throw error;
      router.back();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft color={Colors.text} size={24} /></TouchableOpacity>
          <Text style={styles.title}>List Your Business</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={!name.trim() || loading} style={[styles.submitBtn, !name.trim() && { opacity: 0.4 }]}>
            {loading ? <ActivityIndicator color={Colors.saffron} /> : <Text style={styles.submitText}>Publish</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Emoji picker */}
          <Text style={styles.label}>Logo / Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {EMOJIS.map(e => (
              <TouchableOpacity key={e} onPress={() => setLogoEmoji(e)} style={[styles.emojiBtn, logoEmoji === e && styles.emojiBtnActive]}>
                <Text style={{ fontSize: 28 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Business Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Makwana Diamonds Ltd." placeholderTextColor={Colors.textSecondary} />

          <Text style={styles.label}>Business Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {TYPES.map(t => (
              <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
                <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="What does your business do?" placeholderTextColor={Colors.textSecondary} multiline />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Surat" placeholderTextColor={Colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Country</Text>
              <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="India" placeholderTextColor={Colors.textSecondary} />
            </View>
          </View>

          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="123 Ring Road..." placeholderTextColor={Colors.textSecondary} />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+91 98765..." placeholderTextColor={Colors.textSecondary} keyboardType="phone-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Website</Text>
              <TextInput style={styles.input} value={website} onChangeText={setWebsite} placeholder="https://..." placeholderTextColor={Colors.textSecondary} keyboardType="url" autoCapitalize="none" />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  title: { fontSize: 18, fontFamily: Typography.display, color: Colors.text },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(232,137,42,0.15)', borderRadius: 20 },
  submitText: { color: Colors.saffron, fontFamily: Typography.bodyBold, fontSize: 14 },
  content: { padding: 20 },
  label: { fontSize: 12, fontFamily: Typography.bodyBold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, color: Colors.text, fontFamily: Typography.body, fontSize: 15, marginBottom: 20 },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row' },
  emojiBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 2, borderColor: 'transparent' },
  emojiBtnActive: { borderColor: Colors.saffron, backgroundColor: 'rgba(232,137,42,0.1)' },
  chip: { backgroundColor: Colors.surface2, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: 'rgba(232,137,42,0.15)', borderColor: Colors.saffron },
  chipText: { color: Colors.textSecondary, fontFamily: Typography.bodyBold, fontSize: 12 },
  chipTextActive: { color: Colors.saffron },
});
